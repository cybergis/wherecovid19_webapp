$(function() {
    $('.nav.nav-pills a').on('click', function(e) {
        e.preventDefault();
        $(this).tab('show');
    });

    $('#sidebar_control').on('click', function(e) {
        if($(".sidebar").hasClass("open")) {
            $('#sidebar_control').removeClass("open").addClass("closed");
            $(".sidebar").animate({width:'toggle'},10).removeClass("open").addClass("closed");
            // $(".sidebar").removeClass("open").hide("slide", { direction: "left" }, 1000).addClass("closed");
            $("main").removeClass("col-9").addClass("col-12");
        } else {
            $('#sidebar_control').removeClass("closed").addClass("open");
            $(".sidebar").animate({width:'toggle'},10).removeClass("closed").addClass("open");
            // $(".sidebar").removeClass("closed").show("slide", { direction: "left" }, 1000).addClass("open");
            $("main").removeClass("col-12").addClass("col-9");
        }
    });

});