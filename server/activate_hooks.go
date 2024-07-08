package main

func (p *Plugin) OnActivate() error {
	p.slackClient = GetSlackInstance()
	p.initializeAPI()
	return nil
}
