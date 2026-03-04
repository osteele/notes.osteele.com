---
title: "Raspberry Pi"
layout: ../../layouts/BaseLayout.astro
---

The Raspberry Pi is a small, affordable computer for learning programming and physical computing.

## Create a SD Card

Use BalenaEtcher to create a SD card. 8GB is adequate for Raspbian if you don't install too much on it.

## Networking Configuration

Setup involves joining WiFi, optionally changing hostname, and enabling SSH access.

### Enable SSH

Three methods:

1.  Use the UI (Raspberry Pi Configuration)
2.  Command line:
    
    <div class="code-example"><pre><code>sudo systemctl enable ssh
    sudo systemctl start ssh</code></pre></div>
    
3.  Create empty `ssh` file on boot partition

### Change Hostname

<div class="code-example"><pre><code>sudo nano /etc/hosts
sudo nano /etc/hostname</code></pre></div>

### Disable Password Login

Edit `/etc/ssh/sshd_config` to disable password authentication after setting up SSH keys.

## Install ngrok

Download from [ngrok.com/download](https://ngrok.com/download), unzip to `~/bin`, then configure:

<div class="code-example"><pre><code># Configure ngrok
ngrok authtoken YOUR_AUTH_TOKEN

# Settings go in ~/.ngrok2/ngrok.yml</code></pre></div>

## Home Automation

### Install MQTT (RabbitMQ)

<div class="code-example"><pre><code>curl -s https://packagecloud.io/install/repositories/rabbitmq/rabbitmq-server/script.deb.sh | sudo bash
sudo apt-get install rabbitmq-server
sudo systemctl enable rabbitmq-server</code></pre></div>

## Display Configuration

Configure via `/boot/config.txt` for HDMI settings and touchscreen setup.

## Screensaver

Wake command:

<div class="code-example"><pre><code>xscreensaver-command -deactivate</code></pre></div>

## Related

<ul class="page-list"><li><a href="/physical-computing/">Physical Computing</a></li><li><a href="/arduino/">Arduino</a></li></ul>
