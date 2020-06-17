$(function () {

  // Promjena pozadine navbara prilikom scroll-a ili klika miša na hamburger meni 
  $('.navbar-toggler').on('click touch', function () {
    $('nav').toggleClass('bg-white');
    $('nav').toggleClass('navbar-dark');
    $('nav').toggleClass('navbar-light');
  });
  

  // Promjena pozadine navbara prilikom scroll-a ili klika miša na hamburger meni 
  $('.input-group .form-control').on('focus', function () {
    $(this).css('border-color', '#fff');
    $('.input-group .input-group-append .input-group-text').css('border-color', '#fff');
  });


  // Promjena pozicije forme za pretragu na stranici books/index
  $(window).scroll(function () {
    let form = $('.top-bar-form');
    if ($(this).scrollTop() < 70) {
        form.css('top', '-5rem');
    } else {
        form.css('top', '0');
    }
});
  
});