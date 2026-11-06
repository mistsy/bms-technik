(function ($) { 

  const accordionItems = document.querySelectorAll('.accordion__item');

  const adjustAccordionHeight = activePanel => { 
    activePanel.style.maxHeight = activePanel.scrollHeight + 'px';
  }

  const adjustAllAccordions = () => { 
    const activeAccordions = document.querySelectorAll('.accordion__item.active');
    activeAccordions.forEach(el => { 
      const activePanel = el.querySelector('.accordion__content-wrapper');
      activePanel.style.maxHeight = activePanel.scrollHeight + 'px';
    })
  }

  const accordionHandler = (elements) => {
    if (!elements) return false;
    for (const accItem of elements) {
      let toggler = accItem.querySelector('.accordion__title');
      toggler.addEventListener('click', function () {
        if (accItem.classList.contains('active')) {
          let panel = accItem.querySelector('.accordion__content-wrapper');
          accItem.classList.remove('active');
          panel.style.maxHeight = null;
        } else {
          let activePanel = accItem.querySelector(
            '.accordion__content-wrapper',
          );
          initOwls();
          accItem.classList.add('active');
          adjustAccordionHeight(activePanel);  
        }
        window.addEventListener('resize', adjustAllAccordions());
      });
    }
  };

  accordionHandler(accordionItems);

  const owl = $('.bms-slider-accordion');

  const initOwls = function () {
    owl.each(function () {

      $(this).owlCarousel({
        smartSpeed: 1000,
        lazyLoad:true,
        touchDrag: true,
        dots: false,
        nav: true,
        margin: 30,
        navText: ['<svg xmlns="http://www.w3.org/2000/svg" width="55" height="55" viewBox="0 0 55 55"><g transform="translate(-1.5 -1.5)"><path d="M55,29A26,26,0,1,1,29,3,26,26,0,0,1,55,29Z" transform="translate(0 0)" fill="none" stroke="#ff2d23" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"/><path d="M22.4,12,12,22.4,22.4,32.8" transform="translate(6.6 6.6)" fill="none" stroke="#ff2d23" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"/><path d="M32.8,18H12" transform="translate(6.6 11)" fill="none" stroke="#ff2d23" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"/></g></svg>', '<svg xmlns="http://www.w3.org/2000/svg" width="55" height="55" viewBox="0 0 55 55"><g transform="translate(56.5 56.5) rotate(180)"><path d="M55,29A26,26,0,1,1,29,3,26,26,0,0,1,55,29Z" transform="translate(0 0)" fill="none" stroke="#ff2d23" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"/><path d="M22.4,12,12,22.4,22.4,32.8" transform="translate(6.6 6.6)" fill="none" stroke="#ff2d23" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"/><path d="M32.8,18H12" transform="translate(6.6 11)" fill="none" stroke="#ff2d23" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"/></g></svg>'],
        responsive: {
          0: {
            items: 2,
          },
          768: {
            items: 3,
          },
          1366: {
            items: 4,
          },
          1640: {
            items: 5,
          }
        },
      });
    });
  }

  $( '.bms-slider-accordion' ).each( function() {
    $(this).find('a').each(function () { 
      $(this).magnificPopup( {
        type: 'image',
        gallery: {
          enabled: true,
        },
      });
    }
     
    )
  } );

})(jQuery);