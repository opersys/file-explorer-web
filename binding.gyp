{
    "targets": [{
        "target_name": "posix",
        "sources": [ "lib/posix/posix.cc" ]
    },{
        "target_name": "inotify",
        "sources": [ "lib/inotify/bindings.cc", "lib/inotify/node_inotify.cc" ]
    },{
        "target_name": "access",
        "sources": [ "lib/access/access.cc", "lib/access/async.cc",
                     "lib/access/sync.cc" ]
    }]
}
