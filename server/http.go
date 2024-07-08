package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
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
	router.Use(p.requireAuth)

	syncRouter := router.PathPrefix("/sync").Subrouter()
	syncRouter.Use(p.requireAdmin)
	syncRouter.HandleFunc("/start", p.handleStartSync)
	syncRouter.HandleFunc("/stop", p.handleStopSync)

	slackRouter := router.PathPrefix("/slack").Subrouter()
	slackRouter.Use(p.requireAdmin)
	slackRouter.HandleFunc("/upload_zip", p.handleUploadSlackZip)
	slackRouter.HandleFunc("/store_data", p.handleUploadStoreSlackData)

	p.router = router
}

// TODO: Add handlers for the following endpoints:
//
// * /search
// * /sync/start
// * /sync/stop
// * /slack/upload_zip
// * /slack/store_data

// TODO: Fix requireAuth method
// Authentication handler
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

func (p *Plugin) handleStartSync(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "Start Sync")
}

func (p *Plugin) handleStopSync(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "Stop Sync")
}

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
	fmt.Fprint(w, "Upload Store Slack Data")
}
