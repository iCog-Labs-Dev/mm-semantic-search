package main

func (p *Plugin) OnActivate() error {
	p.mmSyncBroker = NewBroker(p)
	p.slackClient = GetSlackInstance()
	p.initializeAPI()
	return nil
}
