package main

func (p *Plugin) OnActivate() error {
	p.initializeAPI()
	return nil
}
