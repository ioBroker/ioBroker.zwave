var comclasses = {
    /*
     #define BASIC_TYPE_CONTROLLER                           0x01
     #define BASIC_TYPE_STATIC_CONTROLLER                    0x02
     #define BASIC_TYPE_SLAVE                                0x03
     #define BASIC_TYPE_ROUTING_SLAVE                        0x04

     #define GENERIC_TYPE_GENERIC_CONTROLLER                 0x01
     #define GENERIC_TYPE_STATIC_CONTROLLER                  0x02
     #define GENERIC_TYPE_AV_CONTROL_POINT                   0x03
     #define GENERIC_TYPE_DISPLAY                            0x06
     #define GENERIC_TYPE_GARAGE_DOOR                        0x07
     #define GENERIC_TYPE_THERMOSTAT                         0x08
     #define GENERIC_TYPE_WINDOW_COVERING                    0x09
     #define GENERIC_TYPE_REPEATER_SLAVE                     0x0F
     #define GENERIC_TYPE_SWITCH_BINARY                      0x10

     #define GENERIC_TYPE_SWITCH_MULTILEVEL                  0x11
     #define SPECIFIC_TYPE_NOT_USED				             0x00
     #define SPECIFIC_TYPE_POWER_SWITCH_MULTILEVEL		     0x01
     #define SPECIFIC_TYPE_MOTOR_MULTIPOSITION		         0x03
     #define SPECIFIC_TYPE_SCENE_SWITCH_MULTILEVEL		     0x04
     #define SPECIFIC_TYPE_CLASS_A_MOTOR_CONTROL		     0x05
     #define SPECIFIC_TYPE_CLASS_B_MOTOR_CONTROL		     0x06
     #define SPECIFIC_TYPE_CLASS_C_MOTOR_CONTROL		     0x07

     #define GENERIC_TYPE_SWITCH_REMOTE                      0x12
     #define GENERIC_TYPE_SWITCH_TOGGLE                      0x13
     #define GENERIC_TYPE_SENSOR_BINARY                      0x20
     #define GENERIC_TYPE_SENSOR_MULTILEVEL                  0x21
     #define GENERIC_TYPE_SENSOR_ALARM			             0xa1
     #define GENERIC_TYPE_WATER_CONTROL                      0x22
     #define GENERIC_TYPE_METER_PULSE                        0x30
     #define GENERIC_TYPE_ENTRY_CONTROL                      0x40
     #define GENERIC_TYPE_SEMI_INTEROPERABLE                 0x50
     #define GENERIC_TYPE_NON_INTEROPERABLE                  0xFF

     #define SPECIFIC_TYPE_ADV_ZENSOR_NET_SMOKE_SENSOR	     0x0a
     #define SPECIFIC_TYPE_BASIC_ROUTING_SMOKE_SENSOR	     0x06
     #define SPECIFIC_TYPE_BASIC_ZENSOR_NET_SMOKE_SENSOR	 0x08
     #define SPECIFIC_TYPE_ROUTING_SMOKE_SENSOR		         0x07
     #define SPECIFIC_TYPE_ZENSOR_NET_SMOKE_SENSOR		     0x09

     #define COMMAND_CLASS_MARK				                 0xef
     #define COMMAND_CLASS_BASIC				             0x20
     #define COMMAND_CLASS_VERSION				             0x86
     #define COMMAND_CLASS_BATTERY				             0x80
     #define COMMAND_CLASS_WAKE_UP                         	 0x84
     #define COMMAND_CLASS_CONTROLLER_REPLICATION          	 0x21
     #define COMMAND_CLASS_SWITCH_MULTILEVEL               	 0x26
     #define COMMAND_CLASS_SWITCH_ALL			             0x27
     #define COMMAND_CLASS_SENSOR_BINARY			         0x30
     #define COMMAND_CLASS_SENSOR_MULTILEVEL			     0x31
     #define COMMAND_CLASS_SENSOR_ALARM			             0x9c
     #define COMMAND_CLASS_ALARM				             0x71
     #define COMMAND_CLASS_MULTI_CMD                         0x8F
     #define COMMAND_CLASS_CLIMATE_CONTROL_SCHEDULE		     0x46
     #define COMMAND_CLASS_CLOCK				             0x81
     #define COMMAND_CLASS_ASSOCIATION			             0x85
     #define COMMAND_CLASS_CONFIGURATION			         0x70
     #define COMMAND_CLASS_MANUFACTURER_SPECIFIC		     0x72
     #define COMMAND_CLASS_APPLICATION_STATUS 		         0x22
     #define COMMAND_CLASS_ASSOCIATION_COMMAND_CONFIGURATION 0x9B
     #define COMMAND_CLASS_AV_CONTENT_DIRECTORY_MD		     0x95
     #define COMMAND_CLASS_AV_CONTENT_SEARCH_MD		         0x97
     #define COMMAND_CLASS_AV_RENDERER_STATUS		         0x96
     #define COMMAND_CLASS_AV_TAGGING_MD			         0x99
     #define COMMAND_CLASS_BASIC_WINDOW_COVERING		     0x50
     #define COMMAND_CLASS_CHIMNEY_FAN			             0x2A
     #define COMMAND_CLASS_COMPOSITE				         0x8D
     #define COMMAND_CLASS_DOOR_LOCK				         0x62
     #define COMMAND_CLASS_ENERGY_PRODUCTION		         0x90
     #define COMMAND_CLASS_FIRMWARE_UPDATE_MD		         0x7a
     #define COMMAND_CLASS_GEOGRAPHIC_LOCATION		         0x8C
     #define COMMAND_CLASS_GROUPING_NAME			         0x7B
     #define COMMAND_CLASS_HAIL				                 0x82
     #define COMMAND_CLASS_INDICATOR				         0x87
     #define COMMAND_CLASS_IP_CONFIGURATION			         0x9A
     #define COMMAND_CLASS_LANGUAGE				             0x89
     #define COMMAND_CLASS_LOCK				                 0x76
     #define COMMAND_CLASS_MANUFACTURER_PROPRIETARY	         0x91
     #define COMMAND_CLASS_METER_PULSE			             0x35
     #define COMMAND_CLASS_METER				             0x32
     #define COMMAND_CLASS_MTP_WINDOW_COVERING		         0x51
     #define COMMAND_CLASS_MULTI_INSTANCE_ASSOCIATION	     0x8E
     #define COMMAND_CLASS_MULTI_INSTANCE			         0x60
     #define COMMAND_CLASS_NO_OPERATION			             0x00
     #define COMMAND_CLASS_NODE_NAMING			             0x77
     #define COMMAND_CLASS_NON_INTEROPERABLE		         0xf0
     #define COMMAND_CLASS_POWERLEVEL			             0x73
     #define COMMAND_CLASS_PROPRIETARY			             0x88
     #define COMMAND_CLASS_PROTECTION			             0x75
     #define COMMAND_CLASS_REMOTE_ASSOCIATION_ACTIVATE	     0x7c
     #define COMMAND_CLASS_REMOTE_ASSOCIATION		         0x7d
     #define COMMAND_CLASS_SCENE_ACTIVATION			         0x2b
     #define COMMAND_CLASS_SCENE_ACTUATOR_CONF		         0x2C
     #define COMMAND_CLASS_SCENE_CONTROLLER_CONF	         0x2D
     #define COMMAND_CLASS_SCREEN_ATTRIBUTES		         0x93
     #define COMMAND_CLASS_SCREEN_MD				         0x92
     #define COMMAND_CLASS_SECURITY				             0x98
     #define COMMAND_CLASS_SENSOR_CONFIGURATION		         0x9E
     #define COMMAND_CLASS_SILENCE_ALARM			         0x9d
     #define COMMAND_CLASS_SIMPLE_AV_CONTROL		         0x94
     #define COMMAND_CLASS_SWITCH_BINARY			         0x25
     #define COMMAND_CLASS_SWITCH_TOGGLE_BINARY		         0x28
     #define COMMAND_CLASS_SWITCH_TOGGLE_MULTILEVEL	         0x29
     #define COMMAND_CLASS_THERMOSTAT_FAN_MODE		         0x44
     #define COMMAND_CLASS_THERMOSTAT_FAN_STATE		         0x45
     #define COMMAND_CLASS_THERMOSTAT_HEATING		         0x38
     #define COMMAND_CLASS_THERMOSTAT_MODE			         0x40
     #define COMMAND_CLASS_THERMOSTAT_OPERATING_STATE	     0x42
     #define COMMAND_CLASS_THERMOSTAT_SETBACK		         0x47
     #define COMMAND_CLASS_THERMOSTAT_SETPOINT		         0x43
     #define COMMAND_CLASS_TIME_PARAMETERS			         0x8B
     #define COMMAND_CLASS_TIME				                 0x8a
     #define COMMAND_CLASS_USER_CODE				         0x63
     #define COMMAND_CLASS_ZIP_ADV_CLIENT			         0x34
     #define COMMAND_CLASS_ZIP_ADV_SERVER			         0x33
     #define COMMAND_CLASS_ZIP_ADV_SERVICES			         0x2F
     #define COMMAND_CLASS_ZIP_CLIENT			             0x2e
     #define COMMAND_CLASS_ZIP_SERVER			             0x24
     #define COMMAND_CLASS_ZIP_SERVICES			             0x23
     */

    0x20: {
        name: 'BASIC',
        role: 'switch',
        children: {
            Basic: {role: 'level'}
        }
    },
    0x86: {name: 'VERSION',                                role: 'meta.version', children: {
        'Library Version':      {type: 'text'},
        'Protocol Version':     {type: 'text'},
        'Application Version':  {type: 'text'}
    }},
    0x80: {name: 'BATTERY',                                role: 'info',         children: {
        'Battery Level':        {role: 'value.battery'}
    }},
    0x84: {name: 'WAKE_UP',                                role: ''},
    0x21: {name: 'CONTROLLER_REPLICATION',                 role: ''},
    0x26: {name: 'SWITCH_MULTILEVEL',                      role: 'light.dimmer', children: {
        Level:                  {role: 'level.dimmer'}
    }},
    0x27: {name: 'SWITCH_ALL',                             role: ''},
    0x30: {name: 'SENSOR_BINARY',                          role: 'sensor'},
    0x31: {name: 'SENSOR_MULTILEVEL',                      role: 'sensor',       children: {
        Temperature:            {role: 'value.temperature'}
    }},
    0x9c: {name: 'SENSOR_ALARM',                           role: 'alarm'},
    0x71: {name: 'ALARM',                                  role: ''},
    0x8F: {name: 'MULTI_CMD',                              role: ''},
    0x46: {name: 'CLIMATE_CONTROL_SCHEDULE',               role: ''},
    0x81: {name: 'CLOCK',                                  role: ''},
    0x85: {name: 'ASSOCIATION',                            role: ''},
    0x70: {name: 'CONFIGURATION',                          role: 'meta.config',  children: {
        Level:                  {role: 'level.dimmer'}
    }},
    0x72: {name: 'MANUFACTURER_SPECIFIC',                  role: ''},
    0x22: {name: 'APPLICATION_STATUS',                     role: ''},
    0x9B: {name: 'ASSOCIATION_COMMAND_CONFIGURATION',      role: ''},
    0x95: {name: 'AV_CONTENT_DIRECTORY_MD',                role: ''},
    0x97: {name: 'AV_CONTENT_SEARCH_MD',                   role: ''},
    0x96: {name: 'AV_RENDERER_STATUS',                     role: ''},
    0x99: {name: 'AV_TAGGING_MD',                          role: ''},
    0x50: {name: 'BASIC_WINDOW_COVERING',                  role: ''},
    0x2A: {name: 'CHIMNEY_FAN',                            role: ''},
    0x8D: {name: 'COMPOSITE',                              role: ''},
    0x62: {name: 'DOOR_LOCK',                              role: ''},
    0x90: {name: 'ENERGY_PRODUCTION',                      role: ''},
    0x7a: {name: 'FIRMWARE_UPDATE_MD',                     role: ''},
    0x8C: {name: 'GEOGRAPHIC_LOCATION',                    role: ''},
    0x7B: {name: 'GROUPING_NAME',                          role: ''},
    0x82: {name: 'HAIL',                                   role: ''},
    0x87: {name: 'INDICATOR',                              role: ''},
    0x9A: {name: 'IP_CONFIGURATION',                       role: 'meta.config'},
    0x89: {name: 'LANGUAGE',                               role: ''},
    0x76: {name: 'LOCK',                                   role: ''},
    0x91: {name: 'MANUFACTURER_PROPRIETARY',               role: ''},
    0x35: {name: 'METER_PULSE',                            role: ''},
    0x32: {name: 'METER',                                  role: ''},
    0x51: {name: 'MTP_WINDOW_COVERING',                    role: ''},
    0x8E: {name: 'MULTI_INSTANCE_ASSOCIATION',             role: ''},
    0x60: {name: 'MULTI_INSTANCE',                         role: ''},
    0x00: {name: 'NO_OPERATION',                           role: ''},
    0x77: {name: 'NODE_NAMING',                            role: ''},
    0xf0: {name: 'NON_INTEROPERABLE',                      role: ''},
    0x73: {name: 'POWERLEVEL',                             role: ''},
    0x88: {name: 'PROPRIETARY',                            role: ''},
    0x75: {name: 'PROTECTION',                             role: ''},
    0x7c: {name: 'REMOTE_ASSOCIATION_ACTIVATE',            role: ''},
    0x7d: {name: 'REMOTE_ASSOCIATION',                     role: ''},
    0x2b: {name: 'SCENE_ACTIVATION',                       role: ''},
    0x2C: {name: 'SCENE_ACTUATOR_CONF',                    role: ''},
    0x2D: {name: 'SCENE_CONTROLLER_CONF',                  role: ''},
    0x93: {name: 'SCREEN_ATTRIBUTES',                      role: ''},
    0x92: {name: 'SCREEN_MD',                              role: ''},
    0x98: {name: 'SECURITY',                               role: ''},
    0x9E: {name: 'SENSOR_CONFIGURATION',                   role: ''},
    0x9d: {name: 'SILENCE_ALARM',                          role: ''},
    0x94: {name: 'SIMPLE_AV_CONTROL',                      role: ''},
    0x25: {name: 'SWITCH_BINARY',                          role: 'switch'},
    0x28: {name: 'SWITCH_TOGGLE_BINARY',                   role: ''},
    0x29: {name: 'SWITCH_TOGGLE_MULTILEVEL',               role: ''},
    0x44: {name: 'THERMOSTAT_FAN_MODE',                    role: ''},
    0x45: {name: 'THERMOSTAT_FAN_STATE',                   role: ''},
    0x38: {name: 'THERMOSTAT_HEATING',                     role: ''},
    0x40: {name: 'THERMOSTAT_MODE',                        role: ''},
    0x42: {name: 'THERMOSTAT_OPERATING_STATE',             role: ''},
    0x47: {name: 'THERMOSTAT_SETBACK',                     role: ''},
    0x43: {name: 'THERMOSTAT_SETPOINT',                    role: ''},
    0x8B: {name: 'TIME_PARAMETERS',                        role: ''},
    0x8a: {name: 'TIME',                                   role: ''},
    0x63: {name: 'USER_CODE',                              role: ''},
    0x34: {name: 'ZIP_ADV_CLIENT',                         role: ''},
    0x33: {name: 'ZIP_ADV_SERVER',                         role: ''},
    0x2F: {name: 'ZIP_ADV_SERVICES',                       role: ''},
    0x2e: {name: 'ZIP_CLIENT',                             role: ''},
    0x24: {name: 'ZIP_SERVER',                             role: ''},
    0x23: {name: 'ZIP_SERVICES',                           role: ''},
    0x5B: {name: 'CENTRAL_SCENE',                          role: ''}
};
if (typeof module !== 'undefined' && module.parent) {
    module.exports = comclasses;
}