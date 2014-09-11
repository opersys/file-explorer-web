// The code below is inspired by https://github.com/rvagg/node-addon-examples/blob/master/9_async_work/async.cc
// Amended to run access() function from unistd.h asynchronously

#include <node.h>
#include <unistd.h>
#include <string.h>
#include "async.h"

using namespace v8;

// libuv allows us to pass around a pointer to an arbitrary object when running asynchronous functions.
// We create a data structure to hold the data we need during and after the async work.
typedef struct AsyncData {
    char *path;
    int amode;
    Persistent<Function> callback;
    int result;
} AsyncData;

// Function to execute inside the worker-thread.
// It is not safe to access V8, or V8 data structures here, so everything we need for input and output should go on our req->data object.
void AsyncWork(uv_work_t *req) {
    // Fetch our data structure
    AsyncData *asyncData = (AsyncData *) req->data;

    // Run access() and assign the result to our data structure
    asyncData->result = access(asyncData->path, asyncData->amode);
}

// Function to execute when the async work is complete. This function will be run inside the main event loop so it is safe to use V8 again
void AsyncAfter(uv_work_t *req) {
    HandleScope scope;

    // Fetch our data structure
    AsyncData *asyncData = (AsyncData *)req->data;
    // Create an arguments array for the callback
    Handle<Value> cbArgs[] = {
        // No error
        Null(),
        // Calling access() returns 0 in case the access to the path is granted
        Boolean::New(asyncData->result == 0)
    };

    // Surround in a try/catch for safety
    TryCatch try_catch;
    // Execute the callback function
    asyncData->callback->Call(Context::GetCurrent()->Global(), 2, cbArgs);
    if (try_catch.HasCaught())
        node::FatalException(try_catch);

    // Dispose the persistent handle so these can be garbage-collected
    asyncData->callback.Dispose();
    // Clean up any memory we allocated
    delete asyncData->path;
    delete asyncData;
    delete req;
}

// Asynchronous access to the `access()` function
Handle<Value> accessAsync(const Arguments& args) {
    HandleScope scope;

    // Check of argument count and their types
    if (args.Length() != 3) {
        ThrowException(Exception::TypeError(String::New("Three arguments are required - String, Number, and a callback")));
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
    if (!args[2]->IsFunction()) {
        ThrowException(Exception::TypeError(String::New("Third argument must be of Function type")));
        return scope.Close(Undefined());
    }

    // Create our data structure that will be passed around
    AsyncData *asyncData = new AsyncData;
    // Duplicate the path value to prevent garbage-collection of the original value
    asyncData->path = strdup(*String::Utf8Value(args[0]->ToString()));
    asyncData->amode = args[1]->Uint32Value();
    // Create a persistent reference to callback function so it will not get garbage-collected
    asyncData->callback = Persistent<Function>::New(Local<Function>::Cast(args[2]));

    // Create an async work token and assign our data structure to it
    uv_work_t *req = new uv_work_t;
    req->data = asyncData;

    // Pass the work token to libuv to be run when a worker-thread is available to
    uv_queue_work(
        uv_default_loop(),
        req,                           // Work token
        AsyncWork,                     // Work function
        (uv_after_work_cb) AsyncAfter  // Function to run when complete
    );

    return scope.Close(Undefined());
}
