![Logo](admin/zwave.png)
ioBroker zwave Adapter
==============

Zwave support with openzwave.

For this adapter is used rather good supported npm module: https://github.com/OpenZWave/node-openzwave-shared<br>
You should find out what the name has USB port of the Z-Wave stick and setup it in the adapter settings.

## Important Information
- On first run, the Adapter needs some time, to calculate all Objects within iobroker.
- If you add a Device, let the adapter do it's job and wait a little bit.
- If a Device is not visible within the included Admistration Site, it's not fully
imported into ioBroker.


## Installation
First of all, Implemenation is tested only on ARM Linux (e.g. Raspberry Pi (2)).<br>
You need a fully Development Environment (gcc, make,...)

npm install iobroker.zwave does following Steps for you:<br>

- Download and install latest openzwave from github<br>
  \# cd /opt<br>
  \# curl -L -O https://github.com/OpenZWave/open-zwave/archive/master.zip<br>
  \# unzip master.zip<br>
  \# cd open-zwave-master<br>
  \# make<br>
  \# sudo make install<br>

After that you have to do the following Steps:<br>

- Put your USB Stick into your Server
- Check whether the system has recognized the USB stick<br>
  \# lsusb<br>
  \# ls -al /dev/ttyA*<br>
  
- Go into iobroker Website and add the Zwave Adapter
- Configure zwave Adapter as described 
- Start the new zwave Adapter instance
- wait<br>
  -- until the Message "zwave.0 Scan completed" is found in iobroker.log<br>
  -- the Object zwave.0.completed has State "true"<br>

## Configuration
Within Admin Settings you can set following Attributes<br>

- Force objects re-init (ReInitialize all Objects within ioBroker)
- USB name (the USB Port of your Z-Wave stick)
- Logging (enable logging to OZW_Log.txt)
- Console Output (copy logging to the console, Logs all to ioBroker.log)
- Save Config (write an XML network layout create a /zwcfg_<HOMEID>.xml on linux)
- Driver Attempts (try this many times before giving up)
- Poll Interval (interval between polls in milliseconds)
- Suppress Refresh (do not send updates if nothing changed)

![admin-settings](img/admin-settings.png)

## Logfiles / Configuration Settings
If you have installed iobroker into default Folder:<br>
 - Logfile: /opt/iobroker/node_modules/iobroker.zwave/node_modules/openzwave-shared/OZW_Log.txt on linux<br>
 - Configuration: /opt/iobroker/node_modules/iobroker.zwave/node_modules/zwcfg_<HOMEID>.xml on linux<br>

## Device add or remove
If you add or remove a device, it takes 60 seconds. Then the page is automatically reloaded.<br>
If you change the Name or Location, it takes 5 seconds. Then the page is automatically reloaded.

## Features
Within OpenZWave Configurator you can see all Nodes and their classes.

Following Actions are current supported (only with Contextmenu):<br>
- Set Name and Set Location for Node itself<br>
- Change Value of a class<br>

Following global Actions are current supported:<br>
- Add Nodes<br>
- Remove Nodes<br>
- Refresh Nodes (Refresh Nodes from ioBroker Communication)<br>

## Todo
### ZWave Specific
- Scenes
- Group Management
- Reset (Soft/Hard)
- Network Commands (Heal, getNeighbors, refreshNode)
- Polling
- Controller Commands
- Configuration Commands
### Global
- Test more Hardware
- Move config and logfile into iobroker default path (/opt/iobroker/log, /opt/iobroker/data/files/zwave)
- Language Support (English, German, Russian)

## Tested Hardware
### ZWave
- ZME_UZB1 USB Stick
- RazBerry GPIO Board for RaspBerry (1/2)
### Fibaro
- FGBS001 Universal Binary Sensor
- FGS222 Double Relay Switch 2x1.5kW
- FGWPE Wall Plug
- FGSS001 Smoke Sensor
- FGMS001 Motion Sensor
### Danfoss
- Danfoss Living Connect Room Thermostat (type 0003, id 8010)
- Danfoss Z Thermostat 014G0013

## Changelog
### 0.2.5 (2015-12-21)
 - (husky-koglhof) Objecttree build now on change/added/ready from zwave
 - Default Role/Type/State (needed for history)
 - openzwave-shared 1.1.6
 - last openzwave from github
 - OpenZWave Security

### 0.2.4 (2015-12-05)
 - (husky-koglhof) fixed hardcoded values
   Admin Page can Add / Remove ZWave Devices
   
### 0.2.3 (2015-11-11)
 - (bluefox) try to fix io-package.json

### 0.2.2 (2015-09-28)
 - (ekarak) API changes for openzwave-shared 1.0.8+

### 0.2.3 (2015-11-11)
 - (bluefox) try to fix io-package.json

### 0.2.2 (2015-09-28)
 - (ekarak) API changes for openzwave-shared 1.0.8+

### 0.2.1 (2015-08-24)
 - (husky-koglhof) Fixed Errors with Config save at OpenZwave Configurator

### 0.2.0 (2015-08-05)
 - (husky-koglhof) Added OpenZWave Configurator, changed Dependency from openzwave to openzwave-shared, Implemented stateChange, objectChange Functions, Implemented extended Settings
 
### 0.1.0 (2015-01-03)
 - enable npm install.
 
### 0.0.9 (2014-11-22)
 - Support of new naming concept.
 
### 0.0.8 (2014-10-31)
 - Fix names of classes.

### 0.0.6 (2014-10-30)
 - Show in config found tty ports.
 
### 0.0.3 (2014-10-30)
 - Classify channels.

### 0.0.2 (2014-10-28)
 - Initial commit. Still non-functional.

## License

Copyright (c) 2014 bluefox <bluefox@ccu.io>

SOFTWARE NOTICE AND LICENSE

OpenZWave is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published
by the Free Software Foundation, either version 3 of the License,
or (at your option) any later version.

OpenZWave is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with OpenZWave.  If not, see <http://www.gnu.org/licenses/>.
