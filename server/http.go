package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"github.com/mattermost/mattermost/server/public/model"
	"github.com/mattermost/mattermost/server/public/plugin"
)

// Requests destined for the /plugins/{id} path will be routed to the plugin.
//
// This implementation sends back whether or not the plugin hooks are currently
// enabled. It is used by the web app to recover from a network reconnection
// and synchronize the state of the plugin's hooks.
func (p *Plugin) ServeHTTP(c *plugin.Context, w http.ResponseWriter, r *http.Request) {
	p.router.ServeHTTP(w, r)
}

func (p *Plugin) initializeAPI() {
	router := mux.NewRouter()

	router.HandleFunc("/search", p.handleSearch)
	// router.Use(p.requireAuth)

	syncRouter := router.PathPrefix("/sync").Subrouter()
	// syncRouter.Use(p.requireAdmin)
	syncRouter.Handle("/start", p.mmSyncBroker)
	syncRouter.Handle("/stop", p.mmSyncBroker)

	slackRouter := router.PathPrefix("/slack").Subrouter()
	// slackRouter.Use(p.requireAdmin)
	slackRouter.HandleFunc("/upload_zip", p.handleUploadSlackZip)
	slackRouter.HandleFunc("/store_data", p.handleUploadStoreSlackData)

	p.router = router
}

// TODO: Fix requireAuth method Authentication handler
func (p *Plugin) requireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// check to see if the user is an authenticated user
		if r.Header.Get("Mattermost-User-ID") == "" {
			http.Error(w, "UnAuthorized: Allowed only for mattermost user", http.StatusUnauthorized)
			// headerJson, _ := json.Marshal(r.Header)
			// http.Error(w, string(headerJson), http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (p *Plugin) requireAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userId := r.Header.Get("Mattermost-User-ID")
		if !p.API.HasPermissionTo(userId, model.PermissionManageSystem) {
			http.Error(w, "UnAuthorized: Allowed only for admin", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// Search handler

func (p *Plugin) handleSearch(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	hasQuery := r.URL.Query().Has("query")
	if !hasQuery {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	query := r.URL.Query().Get("query")

	userId := r.Header.Get("Mattermost-User-ID")

	searchResponse := Search(query, userId)

	searchResponseJSON, err := json.Marshal(searchResponse)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	io.Writer.Write(w, searchResponseJSON)

	responseJSON, _ := json.MarshalIndent(searchResponse, "->", "  ")
	fmt.Println(string(responseJSON))
}

// Sync handlers

// func (p *Plugin) handleStartSync(w http.ResponseWriter, r *http.Request) {
// 	fmt.Fprint(w, "Start Sync")
// }

// func (p *Plugin) handleStopSync(w http.ResponseWriter, r *http.Request) {
// 	fmt.Fprint(w, "Stop Sync")
// }

// Slack handlers

func (p *Plugin) handleUploadSlackZip(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	log.Printf("Upload started ...")

	w.Header().Set("Content-Type", "application/json")
	// w.Header().Set("Access-Control-Allow-Origin", "*")

	// The argument to FormFile must match the name attribute of the file input on the frontend
	file, fileHeader, err := r.FormFile("file")
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Create a new file in the uploads directory
	dst, err := os.Create(fmt.Sprintf("./%d%s", time.Now().Unix(), filepath.Ext(fileHeader.Filename)))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	// Copy the uploaded file to the filesystem at the specified destination
	_, copyError := io.Copy(dst, file)
	if copyError != nil {
		http.Error(w, copyError.Error(), http.StatusInternalServerError)
		return
	}

	extractError := p.slackClient.extractDetailsFromZip(dst.Name())
	if extractError != nil {
		http.Error(w, extractError.Error(), http.StatusInternalServerError)
		return
	}

	// read extracted data from zip and store it p.slackClient.Channels
	readError := p.slackClient.readExtractedData()
	if readError != nil {
		http.Error(w, readError.Error(), http.StatusInternalServerError)
		return
	}

	// delete the zip file after extraction
	deleteError := os.Remove(dst.Name())
	if deleteError != nil {
		http.Error(w, deleteError.Error(), http.StatusInternalServerError)
		return
	}

	channelJson, jsonError := json.Marshal(p.slackClient.Channels)
	if jsonError != nil {
		http.Error(w, jsonError.Error(), http.StatusInternalServerError)
		return
	}

	io.Writer.Write(w, channelJson)
}

func (p *Plugin) handleUploadStoreSlackData(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	requestBody, err := io.ReadAll(r.Body)
	if err != nil {
		log.Printf("error could not read request body: %v \n", err)
		http.Error(w, "Internal Server Error: could not read request body", http.StatusInternalServerError)
		return
	}

	unmarshalError := json.Unmarshal(requestBody, &p.slackClient.FilteredChannels)
	if unmarshalError != nil {
		log.Printf("error while trying to decode JSON: %v \n", unmarshalError)
		http.Error(w, "Internal Server Error: could not decode JSON", http.StatusInternalServerError)
		return
	}

	formattedJSON, _ := json.MarshalIndent(p.slackClient.FilteredChannels, "->", "  ")
	fmt.Println(string(formattedJSON))

	if len(p.slackClient.Channels) <= 0 {
		// read extracted data from zip and store it p.slackClient.Channels
		readError := p.slackClient.readExtractedData()
		if readError != nil {
			http.Error(
				w,
				fmt.Sprintf("slack zip file may not be uploaded. try uploading slack zip file: %v", readError.Error()),
				http.StatusInternalServerError,
			)
			return
		}
	}

	for channelId, channelSpec := range p.slackClient.FilteredChannels {
		channelName := ""
		msgStartDate, msgEndDate := time.Time{}, time.Time{}

		found := false
		// get channel name for current channel
		for _, channel := range p.slackClient.Channels {
			if channel.Id == channelId {
				channelName = channel.Name
				found = true
			}
		}

		if !found {
			return
		}

		log.Println("***********************************")
		log.Printf("Channel: %v \n", channelName)
		log.Println("***********************************")

		// set start and end time to get messages in between them
		if channelSpec.StoreNone {
			continue
		} else if channelSpec.StoreAll {
			msgStartDate = time.Unix(0, 0).UTC()
			msgEndDate = time.Now()
		} else {
			channelStartDate, channelSDError := strconv.Atoi(channelSpec.StartDate)
			if channelSDError != nil {
				log.Printf("error while trying to parse start date: %v \n", channelSDError)
				http.Error(w, "error while trying to parse start date", http.StatusBadRequest)
				return
			}

			msgStartDate = time.Unix(int64(channelStartDate), 0).UTC()

			channelEndDate, channelEDError := strconv.Atoi(channelSpec.EndDate)
			if channelEDError != nil {
				log.Printf("error while trying to parse end date: %v \n", channelEDError)
				http.Error(w, "error while trying to parse end date", http.StatusBadRequest)
				return
			}

			msgEndDate = time.Unix(int64(channelEndDate), 0).UTC()

			if msgStartDate.After(msgEndDate) {
				log.Printf("error - start date cannot be greater than end date\n")

				http.Error(w, "error - start date cannot be greater than end date", http.StatusBadRequest)
				return
			}
		}

		file, err := os.Open(filepath.Join("extracted_slack_data", channelName))
		if err != nil {
			log.Printf("error while trying to open file: %v \n", err)
			http.Error(w, "error while trying to open file", http.StatusInternalServerError)
			return
		}
		defer file.Close()

		messageFiles, err := file.Readdirnames(0) // read all file names
		if err != nil {
			log.Printf("error while trying to read file names: %v \n", err)
			http.Error(w, "error while trying to read file names", http.StatusInternalServerError)
			return
		}
		fmt.Printf("List of files in %v: %v \n", channelName, messageFiles)

		if len(messageFiles) == 0 {
			continue
		}

		// get all files in the channel's folder (each file correspond to daily messages)
		for idx, messageFile := range messageFiles {
			// get the date from the file name
			msgDateStr := filepath.Base(messageFile)
			msgDateStr = msgDateStr[:len(msgDateStr)-5] + "T00:00:00Z"

			msgDate, dateParseError := time.Parse(time.RFC3339, msgDateStr)
			if dateParseError != nil {
				log.Fatalf("error while trying to parse date: %v \n", dateParseError)
				http.Error(w, "error while trying to parse date", http.StatusInternalServerError)
				return
			}

			log.Println("***********************************")
			log.Printf("Messages Date: %v \n", msgDate)
			log.Println("***********************************")

			// don't save the files that are out of the specified date range
			if msgDate.After(msgEndDate) || msgDate.Before(msgStartDate) {
				continue
			}

			// read the contents of the file (all messages sent in that channel in one day)
			messagesInFile := []Message{}
			extractJsonContentFromFile(filepath.Join(channelName, messageFile), &messagesInFile)

			// formattedMsgJSON, _ := json.MarshalIndent(messagesInFile, "->", "  ")
			// fmt.Println(string(formattedMsgJSON))

			// continue to the next file if not message are found in the current one
			if len(messagesInFile) <= 0 {
				continue
			}

			metadatas := []map[string]interface{}{}
			documents := []string{}
			ids := []string{}

			for _, message := range messagesInFile {
				// filter message based on type and subtype
				if message.Type != "message" || message.Id == "" || message.Text == "" {
					continue
				}

				// TODO: replace slack handles like user mentions with user's name
				// message.Text = replaceSlackHandles(message.Text)

				ids = append(ids, message.Id)
				documents = append(documents, message.Text)
				metadatas = append(metadatas, map[string]interface{}{
					"source":       "sl",
					"access":       "pub",
					"user_name":    message.User.RealName,
					"channel_name": channelName,
					"msg_date":     msgDate.Unix(),
				})
			}

			log.Printf("Upserting %v documents to collection \n", len(documents))
			log.Println()

			if len(documents) <= 0 || len(ids) <= 0 || len(metadatas) <= 0 {
				continue
			}

			_, upError := GetSlackInstance().slackCollection.Upsert(context.Background(), nil, metadatas, documents, ids)
			if upError != nil {
				log.Fatalf("Failed to upsert to chroma: %v \n", upError)
				http.Error(w, "Failed to upsert to chroma", http.StatusInternalServerError)
				return
			}

			channelProgress := float64(idx+1) / float64(len(messageFiles))
			p.API.PublishWebSocketEvent("on_progress", map[string]interface{}{
				"progress": map[string]interface{}{
					channelId: channelProgress,
				},
			}, &model.WebsocketBroadcast{})

			// FIX: remove this after testing in production
			time.Sleep(1 * time.Second)
		}
	}

	p.API.PublishWebSocketEvent("on_done", map[string]interface{}{
		"isDone": true,
	}, &model.WebsocketBroadcast{})
}
