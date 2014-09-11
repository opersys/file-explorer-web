#include <node.h>
#include <unistd.h>
#include "sync.h"

using namespace v8;

Handle<Value> accessSync(const Arguments& args) {
    HandleScope scope;

    if (args.Length() != 2) {
        ThrowException(Exception::TypeError(String::New("Two arguments are required - String and Number")));
        return scope.Close(Undefined());
    }

    if (!args[0]->IsString()) {
        ThrowException(Exception::TypeError(String::New("First argument must be of String type")));
        return scope.Close(Undefined());
    }

    if (!args[1]->IsNumber()) {
        ThrowException(Exception::TypeError(String::New("Second argument must be of Number type")));
        return scope.Close(Undefined());
    }

    int ret = access(*String::Utf8Value(args[0]->ToString()), args[1]->NumberValue());

    // access returns 0 in case the access to the path is granted
    return scope.Close(Boolean::New(ret == 0));
}
