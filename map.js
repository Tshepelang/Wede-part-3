/* Roots of Hope Foundation - interactive map (Leaflet + OpenStreetMap tiles) */
(function () {
    'use strict';
    var mapEl = document.getElementById('map');
    if (!mapEl || typeof L === 'undefined') { return; }

    var sites = [
        { name: 'Soweto Garden Hub', address: '45 Vilakazi Street, Orlando West, Soweto', lat: -26.2378, lng: 27.9072 },
        { name: 'Alexandra Community Garden', address: '18 Hofmeyr Street, Alexandra', lat: -26.1027, lng: 28.0963 }
    ];

    var map = L.map(mapEl, { scrollWheelZoom: false }).setView([-26.17, 28.0], 11);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    var bounds = [];
    sites.forEach(function (s) {
        var popup = document.createElement('div');
        var h = document.createElement('strong'); h.textContent = s.name;
        var p = document.createElement('p'); p.textContent = s.address; p.style.margin = '.25rem 0';
        var a = document.createElement('a');
        a.href = 'https://www.google.com/maps/dir/?api=1&destination=' + s.lat + ',' + s.lng;
        a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = 'Get directions';
        popup.appendChild(h); popup.appendChild(p); popup.appendChild(a);
        L.marker([s.lat, s.lng], { title: s.name, alt: s.name + ' marker' }).addTo(map).bindPopup(popup);
        bounds.push([s.lat, s.lng]);
    });
    map.fitBounds(bounds, { padding: [50, 50] });

    // Scroll-wheel zoom is only enabled once the map is clicked, so the page can still scroll past it
    map.on('click', function () { map.scrollWheelZoom.enable(); });
    map.on('mouseout', function () { map.scrollWheelZoom.disable(); });
})();
