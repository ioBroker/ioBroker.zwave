![Logo](admin/zwave.png)
ioBroker zwave Adapter
==============

Zwave support with openzwave.

For this adapter is used rather good supported npm module: https://github.com/OpenZWave/node-openzwave-shared
You should find out what the name has USB port of the Z-Wave stick and setup it in the adapter settings.

Within Admin Settings you can set following Attributes
- Force objects re-init (ReInitialize all Objects within ioBroker)
- USB name (the USB Port of your Z-Wave stick)
- Logging (enable logging to OZW_Log.txt, Logs all to /OZW_Log.txt on linux)
- Console Output (copy logging to the console, Logs all to ioBroker.log)
- Save Config (write an XML network layout create a /zwcfg_<HOMEID>.xml on linux)
- Driver Attempts (try this many times before giving up)
- Poll Interval (interval between polls in milliseconds)
- Suppress Refresh (do not send updates if nothing changed)

![admin-settings](img/admin-settings.png)

Within OpenZWave Configurator you can see all Nodes and their classes.
Following Actions are current supported (only with Contextmenu):
- Set Name and Set Location for Node itself
- Change Value of a class

Following Nodes are tested:
- ZME_UZB1 USB Stick
- FGBS001 Universal Binary Sensor
- FGS222 Double Relay Switch 2x1.5kW
- FGWPE Wall Plug

Objects can changed after "zwave.0 Scan completed" is found in iobroker.log.

## Changelog
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

## Todo


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