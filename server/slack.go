package main

import (
	"archive/zip"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"sync"

	chroma "github.com/amikos-tech/chroma-go"
)

type PurposeDetail struct {
	Value string `json:"value"`
}

type Channel struct {
	Id          string        `json:"id"`
	Name        string        `json:"name"`
	Purpose     PurposeDetail `json:"purpose"`
	DateCreated int           `json:"created"`
}

type ChannelSpec struct {
	StoreAll  bool   `json:"store_all"`
	StoreNone bool   `json:"store_none"`
	StartDate string `json:"start_date"`
	EndDate   string `json:"end_date"`
}

type UserProfile struct {
	RealName    string `json:"real_name"`
	Name        string `json:"name"`
	AvatarImage string `json:"image_72"`
}

type Message struct {
	Id      string      `json:"client_msg_id"`
	Type    string      `json:"type"`
	Subtype string      `json:"subtype"`
	Text    string      `json:"text"`
	Time    string      `json:"ts"`
	User    UserProfile `json:"user_profile"`
}

type Slack struct {
	slackCollection  *chroma.Collection
	Channels         []Channel
	FilteredChannels map[string]ChannelSpec
}

var slackInstance *Slack
var slackOnce sync.Once

func GetSlackInstance() *Slack {
	slackOnce.Do(func() {
		chromaClient := GetChromaInstance()

		newCollection, colError := chromaClient.GetOrCreateCollection("slack")
		if colError != nil {
			log.Fatalf("Error while creating / getting collection: %v \n", colError)
		}

		slackInstance = &Slack{
			slackCollection: newCollection,
		}
	})

	return slackInstance
}

// extract details from ZIP file
func (slack *Slack) extractDetailsFromZip(zipFilePath string) error {
	fileDestinationFolder := "extracted_slack_data"

	// Opening the zip file
	openedZipFile, openError := zip.OpenReader(zipFilePath)

	log.Printf("Extracting zip file: %v \n", zipFilePath)

	if openError != nil {
		return fmt.Errorf("error while trying to open zip file: %v", openError)
	}
	defer openedZipFile.Close()

	for _, fileInZip := range openedZipFile.File {
		filePath := filepath.Join(fileDestinationFolder, fileInZip.Name)
		log.Println("unzipping file", filePath)

		// if the file is empty directory, create a directory
		if fileInZip.FileInfo().IsDir() {
			log.Printf("Directory: %s \n", fileInZip.Name)
			dirError := os.MkdirAll(filePath, os.ModePerm)
			if dirError != nil {
				return fmt.Errorf("error while trying to create directory: %v \n", dirError)
			}

			continue
		}

		if err := os.MkdirAll(filepath.Dir(filePath), os.ModePerm); err != nil {
			if err != nil {
				return fmt.Errorf("error while trying to create directory: %v", err)
			}
		} else {
			destinationFile, err := os.OpenFile(filePath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, fileInZip.Mode())
			if err != nil {
				return fmt.Errorf("error while trying to open file with flag: %v", err)
			}
			defer destinationFile.Close()

			//Opening the file and copy it's contents
			fileInArchive, err := fileInZip.Open()
			if err != nil {
				return fmt.Errorf("error while trying to open file: %v", err)
			}
			defer fileInArchive.Close()

			if _, err := io.Copy(destinationFile, fileInArchive); err != nil {
				return fmt.Errorf("error while trying to copy file to %v: %v", destinationFile, err)
			}
		}
	}

	return nil
}

func (slack *Slack) readExtractedData() error {
	file, err := os.Open("extracted_slack_data")
	if err != nil {
		return fmt.Errorf("error while trying to open extracted_slack_data folder: %v", err)
	}
	defer file.Close()

	list, err := file.Readdirnames(0) // read all file names
	if err != nil {
		return fmt.Errorf("error while trying to read file names from extracted_slack_data folder: %v", err)
	}

	for _, name := range list {
		if name == "channels.json" {
			return extractJsonContentFromFile(name, &slack.Channels)
		}
	}

	return nil
}

func extractJsonContentFromFile(fileName string, receiverPtr interface{}) error {
	jsonFile, jsonError := os.Open(filepath.Join("extracted_slack_data", fileName))
	if jsonError != nil {
		return fmt.Errorf("error while tying to open extracted file, channels.json: %v", jsonError)
	}
	defer jsonFile.Close()

	byteValue, _ := io.ReadAll(jsonFile)

	unmarshalError := json.Unmarshal(byteValue, receiverPtr)
	if unmarshalError != nil {
		return fmt.Errorf("error while trying to decode JSON: %v", unmarshalError)
	}

	return nil
}
