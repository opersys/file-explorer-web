#include <node.h>
#include "sync.h"
#include "async.h"

using namespace v8;

// registers sync and async as functions of a module
void Init(Handle<Object> exports, Handle<Object> module) {
    exports->Set(String::NewSymbol("accessSync"),
        FunctionTemplate::New(accessSync)->GetFunction());
    exports->Set(String::NewSymbol("accessAsync"),
        FunctionTemplate::New(accessAsync)->GetFunction());
}

// invokes functions' registration
NODE_MODULE(access, Init)
