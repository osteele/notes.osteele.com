---
title: "Raspberry Pi"
layout: ../../layouts/BaseLayout.astro
---

# Create a SIM Card

Use BalenaEtcher to create a SIM card. 8GB is adequate for Raspbian if you don't install too much on it.

# Networking

`sudo raspi-config`. Join WiFi. Optionally, change the hostname, here or via `sudo nano /etc/hosts` (followed reboot).

Enable ssh (below)

Discover the IP address. On the Pi: `hostname -I`. Or install Bonjour via `sudo apt-get install avahi-daemon libnss-mdns`. (Seems already to be installed…)

From a local laptop, `ssh-copy-id pi@<IP-ADDRESS>`

## Enable ssh

Three methods:

1. Use the UI.
2. From the command line:
    
    ```bash
    sudo systemctl enable ssh
    sudo systemctl start ssh
    ```
    
3. Create an empty file named `ssh` on the boot partition.

## Disable password login

```bash
sudo sed -i 's/#\?ChallengeResponseAuthentication yes/ChallengeResponseAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/#\?PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/#\?UsePAM yes/UsePAM no/' /etc/ssh/sshd_config
sudo /etc/init.d/ssh reload
```

## Change the hostname

```bash
sudo nano /etc/hosts
sudo nano /etc/hostname
```

# Install FPR client

Download and build.

# Install ngrok

Download ngrok from [https://ngrok.com/download](https://ngrok.com/download). Unzip it into `~/bin`.

Retrieve the ngrok ssh token.

`ngrok authtoken ${TOKEN}`

`ngrok tcp -remote-addr=[1.tcp.ap.ngrok.io:21265](http://1.tcp.ap.ngrok.io:21265/) -region=ap -log=stdout 22 > ngrok.log`

Edit `~/.ngrok2/ngrok.yml`. Add the following after the `authtoken` line.

```
region: ap
log: /var/log/ngrok.log
update: true
tunnels:
  ssh:
    proto: tcp
    addr: 22
    remote_addr: xxxx
    subdomain: 1.tcp.ap.ngrok.io
```

ngrok start ssh

Home Automation

```bash
sudo su homeassistant
cd
source bin/activate
```

## Install MQTT

```bash
curl -s https://packagecloud.io/install/repositories/rabbitmq/rabbitmq-server/script.deb.sh | sudo bash
sudo apt-get install rabbitmq-server
sudo systemctl enable rabbitmq-server
sudo systemctl start rabbitmq-server
sudo rabbitmq-plugins enable rabbitmq_management

In your web browser go to http://<IP of PI>:15672/
```

# Displays

`sudo nano /boot/config.txt`

```
[EDID=XMD-Mi_TV]
hdmi_group=2
hdmi_mode=82 

[all]
cec_osd_name=MoPi
```

See [HDMI resolution table](https://www.raspberrypi.org/documentation/configuration/config-txt/video.md) and [HDMI configuration](https://www.raspberrypi.org/documentation/configuration/hdmi-config.md).

3.5" TFT Touchscreen: 

`cd /home/pi/LCD-show && sudo ./LCD-hdmi`

# Screensaver

Wake from CLI: `xscreensaver-command -deactivate`

[UART](/raspberry-pi/uart/)

[Pinouts](/raspberry-pi/pinouts/)
