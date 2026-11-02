/* Roots of Hope Foundation - upcoming events (dynamic content, search, filter and sort)
   The EVENTS array stands in for a database or API. Dates are sample data for the POE.
   Exposes window.RootsEvents so the enquiry form can reuse the same data. */
(function () {
    'use strict';

    var EVENTS = [
        { id: 'e1',  title: 'Garden Volunteer Day',            type: 'Garden day', location: 'Tembisa',   date: '2026-11-07', time: '08:00', spots: 20, price: 0,  blurb: 'Plant, weed and harvest with the Tembisa garden team.' },
        { id: 'e2',  title: 'Urban Gardening Starter Workshop', type: 'Workshop',   location: 'Soweto',    date: '2026-11-14', time: '09:00', spots: 12, price: 0,  blurb: 'Learn the basics of starting a food garden at home.' },
        { id: 'e3',  title: 'Family Nutrition Workshop',        type: 'Workshop',   location: 'Alexandra', date: '2026-11-21', time: '10:00', spots: 3,  price: 0,  blurb: 'Balanced meals on a budget, led by a dietitian.' },
        { id: 'e4',  title: 'Soweto Harvest Day',               type: 'Garden day', location: 'Soweto',    date: '2026-11-28', time: '08:00', spots: 25, price: 0,  blurb: 'Help harvest spinach, tomatoes and butternut at the Soweto hub.' },
        { id: 'e5',  title: 'Youth Leadership Info Session',    type: 'Youth',      location: 'Soweto',    date: '2026-12-01', time: '14:00', spots: 15, price: 0,  blurb: 'Find out about the 12-week Youth Development Programme.' },
        { id: 'e6',  title: 'Budget Cooking with Garden Produce', type: 'Workshop', location: 'Katlehong', date: '2026-12-05', time: '10:00', spots: 0,  price: 50, blurb: 'Hands-on cooking class. Materials fee covers ingredients.' },
        { id: 'e7',  title: 'Summer Planting Day',              type: 'Garden day', location: 'Alexandra', date: '2026-12-12', time: '08:00', spots: 25, price: 0,  blurb: 'Plant the summer crop at the Alexandra community garden.' },
        { id: 'e8',  title: 'Katlehong Garden Clean-up',        type: 'Garden day', location: 'Katlehong', date: '2027-01-16', time: '08:00', spots: 18, price: 0,  blurb: 'Prepare beds and repair tools for the new growing season.' },
        { id: 'e9',  title: 'Youth Garden Entrepreneurs Showcase', type: 'Youth',   location: 'Soweto',    date: '2027-01-23', time: '11:00', spots: 40, price: 0,  blurb: 'Young growers present their garden micro-business ideas.' },
        { id: 'e10', title: 'Food Preservation Workshop',       type: 'Workshop',   location: 'Tembisa',   date: '2027-02-06', time: '10:00', spots: 10, price: 75, blurb: 'Bottling, drying and storing seasonal produce.' }
    ];

    function parseDate(s) { return new Date(s + 'T00:00:00'); }
    function today() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
    function upcoming() {
        var t = today();
        return EVENTS.filter(function (e) { return parseDate(e.date) >= t; });
    }
    var dateFmt = new Intl.DateTimeFormat('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    function formatDate(s) { return dateFmt.format(parseDate(s)); }
    function formatPrice(p) { return p === 0 ? 'Free' : 'R' + p.toLocaleString('en-US'); }

    window.RootsEvents = { all: EVENTS, upcoming: upcoming, formatDate: formatDate, formatPrice: formatPrice, parseDate: parseDate };

    /* ---------- Events listing (services.html only) ---------- */
    var list = document.getElementById('events-list');
    if (!list) { return; }

    var $search = document.getElementById('event-search');
    var $type = document.getElementById('event-type');
    var $loc = document.getElementById('event-location');
    var $sort = document.getElementById('event-sort');
    var $count = document.getElementById('event-count');
    var $reset = document.getElementById('event-reset');

    function el(tag, className, text) {
        var node = document.createElement(tag);
        if (className) { node.className = className; }
        if (text !== undefined) { node.textContent = text; }
        return node;
    }

    function registerLink(ev) {
        var type = ev.type === 'Garden day' ? 'volunteer' : 'workshop';
        var q = '?type=' + type + '&event=' + encodeURIComponent(ev.id) + '&garden=' + encodeURIComponent(ev.location);
        return 'enquiry.html' + q + '#enquiry-form-heading';
    }

    function card(ev) {
        var article = el('article', 'event-card');
        article.setAttribute('data-type', ev.type);
        article.appendChild(el('p', 'event-card__date', formatDate(ev.date) + ' · ' + ev.time));
        article.appendChild(el('h3', null, ev.title));
        article.appendChild(el('p', null, ev.blurb));

        var meta = el('div', 'event-card__meta');
        meta.appendChild(el('span', null, 'Where: ' + ev.location));
        meta.appendChild(el('span', null, 'Cost: ' + formatPrice(ev.price)));
        article.appendChild(meta);

        var tags = el('div', 'event-card__tags');
        tags.appendChild(el('span', 'tag', ev.type));
        if (ev.spots === 0) { tags.appendChild(el('span', 'tag tag--full', 'Fully booked')); }
        else if (ev.spots <= 5) { tags.appendChild(el('span', 'tag tag--low', 'Only ' + ev.spots + ' places left')); }
        else { tags.appendChild(el('span', 'tag', ev.spots + ' places')); }
        article.appendChild(tags);

        var a = el('a', 'btn btn--green btn--sm', ev.spots === 0 ? 'Join the waiting list' : (ev.type === 'Garden day' ? 'Volunteer on this day' : 'Register interest'));
        a.href = registerLink(ev);
        a.setAttribute('aria-label', a.textContent + ': ' + ev.title);
        article.appendChild(a);
        return article;
    }

    function render() {
        var q = $search.value.trim().toLowerCase();
        var type = $type.value;
        var loc = $loc.value;
        var sort = $sort.value;

        var results = upcoming().filter(function (e) {
            var hay = (e.title + ' ' + e.blurb + ' ' + e.location + ' ' + e.type).toLowerCase();
            return (!q || hay.indexOf(q) !== -1) && (type === 'all' || e.type === type) && (loc === 'all' || e.location === loc);
        });

        results.sort(function (a, b) {
            if (sort === 'name') { return a.title.localeCompare(b.title); }
            if (sort === 'spots') { return b.spots - a.spots; }
            if (sort === 'price') { return a.price - b.price || a.date.localeCompare(b.date); }
            return a.date.localeCompare(b.date);
        });

        while (list.firstChild) { list.removeChild(list.firstChild); }
        results.forEach(function (ev) { list.appendChild(card(ev)); });

        if (results.length === 0) {
            list.appendChild(el('p', 'notice', 'No events match your search. Try a different word or reset the filters.'));
            $count.textContent = 'No events found.';
        } else {
            $count.textContent = 'Showing ' + results.length + ' upcoming event' + (results.length === 1 ? '' : 's') + '.';
        }
    }

    ['input', 'change'].forEach(function (evt) {
        $search.addEventListener(evt, render);
        $type.addEventListener(evt, render);
        $loc.addEventListener(evt, render);
        $sort.addEventListener(evt, render);
    });
    $reset.addEventListener('click', function () {
        $search.value = ''; $type.value = 'all'; $loc.value = 'all'; $sort.value = 'date';
        render();
        $search.focus();
    });

    render();
})();
