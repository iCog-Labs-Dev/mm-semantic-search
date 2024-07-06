package main

import (
	"fmt"
	"net/http"

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
		if !(r.Header.Get("Mattermost-User-ID") != "") {
			http.Error(w, "UnAuthorized: Allowed only for mattermost user", http.StatusUnauthorized)
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
	fmt.Fprint(w, "Test")
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
	fmt.Fprint(w, "Upload Slack Zip")
}

func (p *Plugin) handleUploadStoreSlackData(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "Upload Store Slack Data")
}
