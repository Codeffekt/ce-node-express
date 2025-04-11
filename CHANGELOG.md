## [1.14.2]
 - feat: assets query now support originalname query field

## [1.14.1]
 - feat: graph node query now supported in FormQuery

## [1.14.0]
 - feat: you can now add a Public component dynamically
 - feat: graph node query
 - feat: dyn message queue
 - fix: res total assets
 - fix: delete
 - ref: sse event client

## [1.13.11]
 - Refacto MessagesServer

## [1.13.10]
 - Add keep alive sse events

## [1.13.9]
 - Add init message and disable accel buffering for sse events

## [1.13.8]
 - FIX: missing updates form mtime

## [1.13.7]
 - FIX: get error message on processing start
 - FIX: update forms mtime on processing updates

## [1.13.6]
 - FIX: delete assets now clear all the pointed forms blocks

## [1.13.5]
 - FIX: compute assets array ref from string interpolation
 - FIX: merge block on index type

## [1.13.4]
 - Add specific merge block operations on index type

## [1.13.3]
 - Merge forms params
 - add CE_START_APP_CLEAR_TABLE=<true or false> CE_FORCE_START_APP=<true or false>

## [1.13.2]
 - Fix: set processing form status to error when api call fail
 - Remove @codeffek/ce-events-data and sockets deps

## [1.13.1]
 - Fix: check undefined message client

## [1.13.0]
 - Add Messaging system for micro service architecture
 - Add support with RabbitMq

## [1.12.3] - Entrypoint context for spaces now contains root type

## [1.12.2] - Add SSE Events on form update

## [1.12.1] - Add worker module service

## [1.12.0] - Add Factory mutation

## [1.11.1] - Add entry point in form editor context

## [1.11.0] - Add space code editor API

## [1.10.1] - Add API for forms root

## [0.0.25] - Support for old token version with login instead of uid

## [1.9.1] - Add dotenv support to simplify the application creation

## [1.9.2] - Provides admin accounts config on db init

## [1.9.3] - Create a ce-forms init service to manage ce-forms initialisation

## [1.9.4] - Remove super admin init, add default forms root in init

## [1.9.5] - Add missing forms root forms-mask, forms-style, forms-app, forms-export

## [1.9.6] - Use rootField in form mutation to retrieve root element within a form block

## [1.9.9] - Add postgres > v15 compatibility