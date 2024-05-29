package main

import (
	"fmt"
	"net/http"

	"github.com/gorilla/mux"

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

	syncRouter := router.PathPrefix("/sync").Subrouter()
	syncRouter.Use(p.requireAuth)
	syncRouter.HandleFunc("/start", p.handleStartSync)
	syncRouter.HandleFunc("/stop", p.handleStopSync)
	syncRouter.HandleFunc("/progress", p.handleSyncProgress)

	slackRouter := router.PathPrefix("/slack").Subrouter()
	slackRouter.Use(p.requireAuth)
	slackRouter.HandleFunc("/upload_zip", p.handleUploadSlackZip)
	slackRouter.HandleFunc("/store_data", p.handleUploadStoreSlackData)
	slackRouter.HandleFunc("/store_data_progress", p.handleUploadStoreSlackDataProgress)

	p.router = router
}

// TODO: Add handlers for the following endpoints:
//
// * /search
// * /sync/start
// * /sync/stop
// * /sync/progress
// * /slack/upload_zip
// * /slack/store_data
// * /slack/store_data_progress

// TODO: Fix requireAuth method
// Authentication handler
func (p *Plugin) requireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// if !p.API.HasPermissionTo(r, plugin.ActivatePermission) {
		// 	http.Error(w, "Unauthorized", http.StatusUnauthorized)
		// 	return
		// }

		next.ServeHTTP(w, r)
	})
}

// func (p *Plugin) requireAdmin(next http.Handler) http.Handler {
// 	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
// 		if !p.API.HasPermissionTo(r, plugin.AdminPermission) {
// 			http.Error(w, "Unauthorized", http.StatusUnauthorized)
// 			return
// 		}

// 		next.ServeHTTP(w, r)
// 	})
// }

// Search handler

func (p *Plugin) handleSearch(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "Test")
}

// Sync handlers

func (p *Plugin) handleStartSync(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "Start Sync")
}

func (p *Plugin) handleStopSync(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "Stop Sync")
}

func (p *Plugin) handleSyncProgress(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "Sync Progress")
}

// Slack handlers

func (p *Plugin) handleUploadSlackZip(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "Upload Slack Zip")
}

func (p *Plugin) handleUploadStoreSlackData(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "Upload Store Slack Data")
}

func (p *Plugin) handleUploadStoreSlackDataProgress(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "Upload Store Slack Data Progress")
}
