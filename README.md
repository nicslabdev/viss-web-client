# VISS - MANAGER
Support repository for josesnchz/WAII. (Repository that implements authorization, authentification and other security concepts to w3c/automotive-viss2).
HTML Web application using javascript and golang that can be used to make AGT, AT and Data Requests.
Future config API for AGT and AT (not developed) will be supported.

## Prerequisites and building
GO version 1.17 is required, since some modules are written in go, then compiled to js using <a href="https://github.com/gopherjs/gopherjs">GopherJS</a>.
Since module compilation is required, a script that automatically compiles all modules is given.
TLS communication between the web app and VISS servers should be used, although it is not fully supported. It will be supported and implemented in future versions. 
