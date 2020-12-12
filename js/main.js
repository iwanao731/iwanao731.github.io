$(function(){




    var headerNav = $('header').find('nav');
    
    $('.nav-btn').on('click',function(){
        headerNav.css('display','block').addClass('fade-in');
    });

    $('.close-btn').on('click',function(){
        headerNav.removeClass('fade-in').css('display','none');
    });

});
