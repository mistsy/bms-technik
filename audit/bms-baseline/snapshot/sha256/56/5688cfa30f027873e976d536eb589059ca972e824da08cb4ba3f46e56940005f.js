(function ($) { 

  const owl = $('.bms-slider');

  const initOwls = function () { 
    owl.each(function() {
      const index = $(this).attr('data-index');
      const dotsEl = $(`#dots_${index}`);
  
      $(this).owlCarousel({
        items: 1,
        smartSpeed: 1000,
        touchDrag: true,
        dots: true,
        nav: true,
        dotsContainer: dotsEl,
        navText: ['<svg xmlns="http://www.w3.org/2000/svg" width="55" height="55" viewBox="0 0 55 55"><g transform="translate(-1.5 -1.5)"><path d="M55,29A26,26,0,1,1,29,3,26,26,0,0,1,55,29Z" transform="translate(0 0)" fill="none" stroke="#ff2d23" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"/><path d="M22.4,12,12,22.4,22.4,32.8" transform="translate(6.6 6.6)" fill="none" stroke="#ff2d23" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"/><path d="M32.8,18H12" transform="translate(6.6 11)" fill="none" stroke="#ff2d23" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"/></g></svg>', '<svg xmlns="http://www.w3.org/2000/svg" width="55" height="55" viewBox="0 0 55 55"><g transform="translate(56.5 56.5) rotate(180)"><path d="M55,29A26,26,0,1,1,29,3,26,26,0,0,1,55,29Z" transform="translate(0 0)" fill="none" stroke="#ff2d23" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"/><path d="M22.4,12,12,22.4,22.4,32.8" transform="translate(6.6 6.6)" fill="none" stroke="#ff2d23" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"/><path d="M32.8,18H12" transform="translate(6.6 11)" fill="none" stroke="#ff2d23" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"/></g></svg>'],
        onInitialized: () => {
					$('#owl-loader').css({ opacity: 0 });
					setTimeout(() => {
						$('#owl-loader').hide();
					}, 300);
				},
      });
    });
  }

  $(window).load(function () { 
    initOwls();
  })

})(jQuery);