var fsView,
    options = new Options();

var resizeWindow = function () {
    $("#fs_layout")
        .width($(window).width())
        .height($(window).height());

    w2ui["fs_layout"].resize();
};

$(document).ready(function () {
    var options = new Options();

    options.fetch();

    $("#mainLayout").w2layout({
        name: "fs_layout",
        padding: 4,
        panels: [
            {
                type: "main"
            }
        ]
    });

    fsView = new FileSystemView({
        el: $(w2ui["fs_layout"].el("main")),
        options: options
    });

    options.activate();

    $(window).resize(_.debounce(resizeWindow, 100));

    // Reformat the window content.
    resizeWindow();
});