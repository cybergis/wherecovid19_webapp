$(function() {

    var isChrome = !!window.chrome && !!window.chrome.webstore;

    console.log(isChrome);

    var close_sidebar = function(){
        $('#sidebar_control').removeClass("open").addClass("closed");
        $(".sidebar").css('display', 'none').removeClass("open").addClass("closed");
        $("main").addClass("map-fullscreen");
      }

      var open_sidebar = function(){
        $('#sidebar_control').removeClass("closed").addClass("open");
        $(".sidebar").css('display', 'flex').removeClass("closed").addClass("open");
        $("main").removeClass("map-fullscreen");
      }

      
    $('#sidebar_control').on('click', function(e) {
        if ($(".sidebar").hasClass("open")) {
            close_sidebar();
        } else {
           open_sidebar();
        }
    });

    $('#table-screen-btn').on('click', function(e) {
        $('.content-section').css("transform", "translateX(0%)");
        $('.screen-btn').removeClass('active');
        $(this).addClass('active');
    });

    $('#map-screen-btn').on('click', function(e) {
        $('.content-section').css("transform", "translateX(-100%)");
        $('.screen-btn').removeClass('active');
        $(this).addClass('active');
    });

    $('#about-screen-btn').on('click', function(e) {
        $('.content-section').css("transform", "translateX(-200%)");
        $('.screen-btn').removeClass('active');
        $(this).addClass('active');
    });

    $(".app-drawer").on('click',function(){
        if($(this).hasClass('opened')){
            $(this).removeClass('opened');
        } else {
            $(this).addClass("opened");
        }
    });

    ////////////////////////////
    // Handle Form submission///
    ////////////////////////////
 
    $( "#variables_form" ).submit(function( event ) {
        // close_sidebar();
        // alert( "Handler for .submit() called." );
        fakeLoading();
        event.preventDefault();

        var formEl = $(this);

        var submitButton = $('#variables_form_submit_btn');

        var coutner = 0;
        //console.log(submitButton);

        $.ajax({
            type: 'POST',
            url: "http://hsjp10.cigi.illinois.edu:8000/vne",
            data: formEl.serializeArray(), 
            dataType : 'json', // what type of data do we expect back from the server
            beforeSend: function() {
                $('.overlay-loading ').removeClass('d-none').addClass('d-flex');
                submitButton.prop( "disabled", true );
            }
        })
        .done(function(data){
            // log data to the console so we can see
            //console.log(data);
            // here we will handle errors and validation messages
            if (data.job_id) {
                console.log(data.job_id);
                check_jobstatus(data.job_id, submitButton)
            }
        })// using the fail promise callback
        .fail(function(data) {
            console.log("Error 1");
        });
    });

    var check_jobstatus = function(job_id, submitButton){
        //console.log(job_id);
        var check_url = 'http://hsjp10.cigi.illinois.edu:8000/check/'+job_id;
        
        $.ajax({
            type: 'GET',
            url: check_url,
            success: function(data){
                // log data to the console so we can see
                console.log(data.status);
                    // here we will handle errors and validation messages
                if("SUCCESS" == data.status){

                    //Remove the previous results
                    if($('#vne').length) {
                        $("#vne").remove();
                    } 

                    //Set loading progress bar to 100% 
                    $('#loading_bar .progress-bar').css('width', '100%');
                    
                    //Delay removing the progress bar for 2 seconds 
                    setTimeout(() => {
                        $('.loadLayover').hide()
                    }, 2000);
                    
                    //Remove the loading overlay
                    $('.overlay-loading ').removeClass('d-flex').addClass('d-none');
                    
                    //Enable the submit button again
                    submitButton.prop( "disabled", false );

                    //Close sidebar
                    close_sidebar();

                    //Add iframe top the right sidebar
                    var generated_results = "http://hsjp10.cigi.illinois.edu:8000/job_outputs/"+data.job_id+"/index.html"
                    $('<iframe>', {
                        src: generated_results,
                        id:  'vne',
                        frameborder: 0,
                        scrolling: 'yes'
                        }).appendTo('#results');
                    
                } else if ( "FAILURE" == data.status ) {

                    // If fails, Show error message modal 
                    $('#resultsFailed').modal('show')

                    //Set loading progress bar to 100% 
                    $('#loading_bar .progress-bar').css('width', '100%');
                    
                    //Delay removing the progress bar for 2 seconds 
                    setTimeout(() => {
                        $('.loadLayover').hide()
                    }, 2000);
                    
                    //Remove the loading overlay
                    $('.overlay-loading ').removeClass('d-flex').addClass('d-none');

                    //Enable the submit button again
                    submitButton.prop( "disabled", false );

                } else {

                    //Recursively call check status anbd pass the coutner for the progress bar
                    setTimeout(check_jobstatus, 3000, data.job_id, submitButton);

                    //Test for FAiled case
                    // Comment the line above and uncomment the setTimout below
                    //vne-20200728-204118-33f51508 Failed
                    // setTimeout(check_jobstatus, 3000, "vne-20200728-204118-33f51508", submitButton);
                }
            }
        });
    }

    function fakeLoading() {

        //Show the loading overlay 
        $('.loadLayover').show();

        //init the progress bar
        $('#loading_bar .progress-bar').css('width', '0%');
        $('#loading_bar .progress-bar').addClass('active');

        //unset the transition css of progress bar to get ready for animation
        $('.progress-bar').css('transition','unset');

        //The progress bar run from 0% - 95% in 5 second
        $('#loading_bar .progress-bar').animate( {width: "95%"} , 5000);
    }


});