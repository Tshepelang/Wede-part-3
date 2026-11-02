/* Roots of Hope Foundation - shared interactions (Part 3)
   Uses jQuery for: accordion, tabs, lightbox, scroll reveal and counters.
   Exposes window.RootsUI.openModal() for the modal dialog used by other scripts. */
(function ($) {
    'use strict';

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- Footer year ---------- */
    $('#year').text(new Date().getFullYear());

    /* ---------- Mobile navigation toggle ---------- */
    var $toggle = $('#navToggle');
    var $links = $('#navLinks');

    function closeNav() {
        $links.removeClass('open');
        $toggle.attr('aria-expanded', 'false');
    }

    $toggle.on('click', function () {
        var isOpen = $links.toggleClass('open').hasClass('open');
        $toggle.attr('aria-expanded', String(isOpen));
    });
    $(document).on('click', function (e) {
        if (!$(e.target).closest('#navToggle, #navLinks').length) { closeNav(); }
    });
    $(document).on('keydown', function (e) {
        if (e.key === 'Escape') { closeNav(); }
    });

    /* ---------- Scroll reveal animation ---------- */
    var $reveal = $('.reveal');
    if ('IntersectionObserver' in window && !reduceMotion) {
        var revealObserver = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    $(entry.target).addClass('is-visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });
        $reveal.each(function () { revealObserver.observe(this); });
    } else {
        $reveal.addClass('is-visible');
    }

    /* ---------- Animated statistic counters ---------- */
    function runCounter($el) {
        var target = parseInt($el.data('count'), 10);
        var suffix = $el.data('suffix') || '';
        $({ n: 0 }).animate({ n: target }, {
            duration: 1400,
            easing: 'swing',
            step: function (now) { $el.text(Math.round(now).toLocaleString('en-US') + suffix); },
            complete: function () { $el.text(target.toLocaleString('en-US') + suffix); }
        });
    }
    var $counters = $('[data-count]');
    if ('IntersectionObserver' in window && !reduceMotion) {
        var counterObserver = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) { runCounter($(entry.target)); obs.unobserve(entry.target); }
            });
        }, { threshold: 0.6 });
        $counters.each(function () { counterObserver.observe(this); });
    }

    /* ---------- Accordion (FAQ) ----------
       One panel open at a time; aria-expanded keeps screen readers informed. */
    $('.accordion__trigger').on('click', function () {
        var $btn = $(this);
        var $panel = $('#' + $btn.attr('aria-controls'));
        var opening = $btn.attr('aria-expanded') !== 'true';

        $('.accordion__trigger').not($btn).each(function () {
            var $other = $(this);
            if ($other.attr('aria-expanded') === 'true') {
                $other.attr('aria-expanded', 'false');
                $('#' + $other.attr('aria-controls')).slideUp(180, function () { $(this).prop('hidden', true).css('display', ''); });
            }
        });

        if (opening) {
            $btn.attr('aria-expanded', 'true');
            $panel.prop('hidden', false).hide().slideDown(220);
        } else {
            $btn.attr('aria-expanded', 'false');
            $panel.slideUp(180, function () { $(this).prop('hidden', true).css('display', ''); });
        }
    });

    /* ---------- Tabs (Get Involved page) ---------- */
    $('.tabs').each(function () {
        var $tabs = $(this).find('[role="tab"]');

        function activate($tab, setFocus) {
            $tabs.attr({ 'aria-selected': 'false', tabindex: '-1' });
            $tab.attr({ 'aria-selected': 'true', tabindex: '0' });
            $tabs.each(function () { $('#' + $(this).attr('aria-controls')).prop('hidden', true); });
            $('#' + $tab.attr('aria-controls')).prop('hidden', false).hide().fadeIn(180);
            if (setFocus) { $tab.trigger('focus'); }
        }

        $tabs.on('click', function () { activate($(this), false); });
        $tabs.on('keydown', function (e) {
            var i = $tabs.index(this);
            var next = null;
            if (e.key === 'ArrowRight') { next = $tabs.eq((i + 1) % $tabs.length); }
            if (e.key === 'ArrowLeft') { next = $tabs.eq((i - 1 + $tabs.length) % $tabs.length); }
            if (e.key === 'Home') { next = $tabs.first(); }
            if (e.key === 'End') { next = $tabs.last(); }
            if (next) { e.preventDefault(); activate(next, true); }
        });
    });

    /* "Volunteer with us" style buttons pre-select the matching radio button in the enquiry form */
    $('[data-choose]').on('click', function () {
        var radio = $('input[name="enquiry-type"][value="' + $(this).data('choose') + '"]')[0];
        if (radio) {
            radio.checked = true;
            // jQuery's trigger() does not reach native listeners, so dispatch a real change event
            radio.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });

    /* ---------- Modal dialog (native <dialog>) ---------- */
    var dialog = null;

    function ensureDialog() {
        if (dialog) { return dialog; }
        dialog = document.createElement('dialog');
        dialog.className = 'modal';
        dialog.setAttribute('aria-labelledby', 'modal-title');
        dialog.innerHTML =
            '<div class="modal__inner">' +
            '<button type="button" class="modal__close" aria-label="Close dialog">&times;</button>' +
            '<h2 class="modal__title" id="modal-title"></h2>' +
            '<div class="modal__body"></div>' +
            '<div class="modal__actions"></div>' +
            '</div>';
        document.body.appendChild(dialog);
        $(dialog).on('click', '.modal__close', function () { dialog.close(); });
        // Clicking the dark backdrop (the dialog element itself) closes it
        dialog.addEventListener('click', function (e) { if (e.target === dialog) { dialog.close(); } });
        return dialog;
    }

    function openModal(opts) {
        var d = ensureDialog();
        var $d = $(d);
        $d.find('.modal__title').text(opts.title || '');
        var $body = $d.find('.modal__body').empty();
        if (opts.body) { $body.append(opts.body); }
        var $actions = $d.find('.modal__actions').empty();
        (opts.actions || []).forEach(function (a) { $actions.append(a); });
        $actions.append($('<button type="button" class="btn btn--outline">Close</button>').on('click', function () { d.close(); }));
        if (typeof d.showModal === 'function') {
            if (!d.open) { d.showModal(); }
        } else {
            d.setAttribute('open', '');
        }
    }

    window.RootsUI = { openModal: openModal, closeModal: function () { if (dialog && dialog.open) { dialog.close(); } } };

    // Buttons with data-modal-template open the content of a <template> in the modal (team bios)
    $(document).on('click', '[data-modal-template]', function () {
        var tpl = document.getElementById($(this).data('modal-template'));
        if (!tpl) { return; }
        openModal({ title: $(this).data('modal-title') || '', body: tpl.content.cloneNode(true) });
    });

    /* ---------- Gallery lightbox ---------- */
    var $items = $('#gallery .gallery__item');
    if ($items.length) {
        var lb = document.createElement('dialog');
        lb.className = 'lightbox';
        lb.setAttribute('aria-label', 'Photo viewer');
        lb.innerHTML =
            '<figure class="lightbox__figure">' +
            '<img class="lightbox__img" src="" alt="">' +
            '<figcaption class="lightbox__caption" aria-live="polite"></figcaption>' +
            '<button type="button" class="lightbox__btn lightbox__close" aria-label="Close photo viewer">&times;</button>' +
            '<button type="button" class="lightbox__btn lightbox__prev" aria-label="Previous photo">&#10094;</button>' +
            '<button type="button" class="lightbox__btn lightbox__next" aria-label="Next photo">&#10095;</button>' +
            '</figure>';
        document.body.appendChild(lb);
        var $lb = $(lb);
        var current = 0;

        function show(i) {
            current = (i + $items.length) % $items.length;
            var $item = $items.eq(current);
            var $img = $lb.find('.lightbox__img');
            $img.hide().attr({ src: $item.data('full'), alt: $item.find('img').attr('alt') }).fadeIn(200);
            $lb.find('.lightbox__caption').text($item.data('caption') + ' (' + (current + 1) + ' of ' + $items.length + ')');
        }

        $items.on('click', function () {
            show($items.index(this));
            if (typeof lb.showModal === 'function') { lb.showModal(); } else { lb.setAttribute('open', ''); }
        });
        $lb.on('click', '.lightbox__close', function () { lb.close(); });
        $lb.on('click', '.lightbox__prev', function () { show(current - 1); });
        $lb.on('click', '.lightbox__next', function () { show(current + 1); });
        lb.addEventListener('click', function (e) { if (e.target === lb) { lb.close(); } });
        lb.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowLeft') { show(current - 1); }
            if (e.key === 'ArrowRight') { show(current + 1); }
        });
    }
})(jQuery);
