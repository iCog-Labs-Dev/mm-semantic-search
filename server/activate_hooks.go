package main

import (
	"log"
	"time"

	"github.com/mattermost/mattermost/server/public/model"
)

func (p *Plugin) OnActivate() error {
	p.mmSync = GetSyncInstance()
	p.mmSyncBroker = NewBroker(p)
	p.slackClient = GetSlackInstance()
	p.initializeAPI()

	// on sync status change. replacement for '/status' route
	go func() {
		previousIsSyncInProgress := false
		previousIsFetchInProgress := false

		for {
			isSyncInProgress, err := p.mmSync.GetIsSyncInProgress()
			if err != nil {
				log.Println("error while trying to get IsSyncInProgress: ", err)
				return
			}

			isFetchInProgress, err := p.mmSync.GetIsFetchInProgress()
			if err != nil {
				log.Println("error while trying to get GetIsFetchInProgress: ", err)
				return
			}

			if isSyncInProgress != previousIsSyncInProgress || isFetchInProgress != previousIsFetchInProgress {
				previousIsSyncInProgress = isSyncInProgress
				previousIsFetchInProgress = isFetchInProgress

				p.API.PublishWebSocketEvent("on_sync_status_change", map[string]interface{}{
					"status": map[string]interface{}{
						"is_sync_in_progress":  isSyncInProgress,
						"is_fetch_in_progress": isFetchInProgress,
					},
				}, &model.WebsocketBroadcast{})
			}

			time.Sleep(1 * time.Second)
		}
	}()
	return nil
}
