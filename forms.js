/* Roots of Hope Foundation - form validation, enquiry processing and contact email (Part 3)
   - Client-side validation with inline error messages (no alert() boxes)
   - Enquiry form: validates, calculates a cost / availability response, submits with AJAX (fetch)
   - Contact form: validates, compiles an email and lets the visitor send it to RECIPIENT */
(function () {
    'use strict';

    /* The email address that receives messages from the contact form */
    var RECIPIENT = 'info@rootsofhope.org.za';

    var PRICES = { garden: 5000, equipment: 1500, workshop: 2500 };
    var PACKAGE_LABELS = {
        garden: 'Garden sponsorship (per garden, per year)',
        equipment: 'Equipment pack',
        workshop: 'Workshop sponsorship',
        general: 'General donation'
    };

    /* ---------- Small helpers ---------- */
    function $(id) { return document.getElementById(id); }
    function money(n) { return 'R' + n.toLocaleString('en-US'); }
    function el(tag, className, text) {
        var n = document.createElement(tag);
        if (className) { n.className = className; }
        if (text !== undefined) { n.textContent = text; }
        return n;
    }

    /* ---------- Validation ---------- */
    var NAME_RE = /^[A-Za-zÀ-ɏ][A-Za-zÀ-ɏ' -]{1,59}$/;
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
    var PHONE_RE = /^(\+27|0)[1-9][0-9]{8}$/;   // South African numbers: 0712345678 or +27712345678

    function isActive(field) { return !field.closest('[hidden]'); }

    function selectedType(form) {
        var r = form.querySelector('input[name="enquiry-type"]:checked');
        return r ? r.value : '';
    }

    function validateField(field, form) {
        if (field.disabled || !isActive(field)) { return ''; }
        var label = field.getAttribute('data-label') || 'This field';
        var value = field.value.trim();
        var requiredIf = field.getAttribute('data-required-if');
        var required = field.required || (requiredIf && form && selectedType(form) === requiredIf);

        if (!value) {
            if (!required) { return ''; }
            return field.tagName === 'SELECT' ? 'Please select ' + label.toLowerCase() + '.' : label + ' is required.';
        }

        var min = field.getAttribute('minlength');
        var max = field.getAttribute('maxlength');
        if (min && value.length < parseInt(min, 10)) { return label + ' must be at least ' + min + ' characters (currently ' + value.length + ').'; }
        if (max && value.length > parseInt(max, 10)) { return label + ' must be ' + max + ' characters or fewer.'; }

        switch (field.getAttribute('data-type')) {
            case 'name':
                if (!NAME_RE.test(value)) { return label + ' may only contain letters, spaces, hyphens and apostrophes (2-60 characters).'; }
                break;
            case 'email':
                if (!EMAIL_RE.test(value)) { return 'Enter a valid email address, e.g. name@example.com.'; }
                break;
            case 'phone':
                if (!PHONE_RE.test(value.replace(/[\s\-()]/g, ''))) { return 'Enter a valid South African phone number, e.g. 071 234 5678 or +27 71 234 5678.'; }
                break;
            case 'date':
                var d = new Date(value + 'T00:00:00');
                var now = new Date(); now.setHours(0, 0, 0, 0);
                var limit = new Date(now); limit.setMonth(limit.getMonth() + 6);
                if (isNaN(d.getTime())) { return 'Enter a valid date.'; }
                if (d < now) { return label + ' cannot be in the past.'; }
                if (d > limit) { return label + ' must be within the next 6 months.'; }
                break;
            case 'number':
                var n = Number(value);
                var lo = field.getAttribute('min');
                var hi = field.getAttribute('max');
                if (!/^\d+$/.test(value) || isNaN(n)) { return label + ' must be a whole number.'; }
                if (lo !== null && n < Number(lo)) { return label + ' must be at least ' + lo + '.'; }
                if (hi !== null && n > Number(hi)) { return label + ' must be ' + hi + ' or less.'; }
                break;
        }
        return '';
    }

    function errorBox(field) {
        var id = field.id + '-error';
        var box = $(id);
        if (!box) {
            box = el('p', 'field-error');
            box.id = id;
            box.hidden = true;
            field.parentNode.appendChild(box);
            var described = field.getAttribute('aria-describedby');
            field.setAttribute('aria-describedby', (described ? described + ' ' : '') + id);
        }
        return box;
    }

    function showFieldState(field, message) {
        var box = errorBox(field);
        if (message) {
            box.textContent = message;
            box.hidden = false;
            field.classList.add('is-invalid');
            field.classList.remove('is-valid');
            field.setAttribute('aria-invalid', 'true');
        } else {
            box.hidden = true;
            field.classList.remove('is-invalid');
            if (field.value.trim()) { field.classList.add('is-valid'); } else { field.classList.remove('is-valid'); }
            field.removeAttribute('aria-invalid');
        }
    }

    function validateRadios(form) {
        var group = $('enq-type-group');
        var ok = !!selectedType(form);
        var box = $('enq-type-error');
        if (!box) {
            box = el('p', 'field-error');
            box.id = 'enq-type-error';
            group.appendChild(box);
        }
        box.textContent = ok ? '' : 'Please choose how you would like to get involved.';
        box.hidden = ok;
        return ok;
    }

    /* Validates every active field; returns the first invalid field (or null) and the error count */
    function validateForm(form) {
        var first = null;
        var errors = 0;
        if (form.id === 'enquiryForm' && !validateRadios(form)) {
            errors++;
            first = form.querySelector('input[name="enquiry-type"]');
        }
        Array.prototype.forEach.call(form.querySelectorAll('input[data-label], select[data-label], textarea[data-label]'), function (field) {
            var msg = validateField(field, form);
            showFieldState(field, msg);
            if (msg) { errors++; if (!first) { first = field; } }
        });
        return { first: first, errors: errors };
    }

    /* Live feedback: validate when leaving a field, and keep re-checking once it has been flagged */
    function attachLiveValidation(form) {
        Array.prototype.forEach.call(form.querySelectorAll('input[data-label], select[data-label], textarea[data-label]'), function (field) {
            field.addEventListener('blur', function () { showFieldState(field, validateField(field, form)); });
            var evt = field.tagName === 'SELECT' ? 'change' : 'input';
            field.addEventListener(evt, function () {
                if (field.classList.contains('is-invalid')) { showFieldState(field, validateField(field, form)); }
            });
        });
    }

    function setStatus(box, message, kind) {
        box.textContent = message;
        box.className = 'form-status' + (kind ? ' form-status--' + kind : '');
        box.hidden = !message;
    }

    function failSummary(form, statusBox, result) {
        setStatus(statusBox, 'Please fix ' + result.errors + (result.errors === 1 ? ' problem' : ' problems') + ' below and try again.', '');
        if (result.first) { result.first.focus(); }
    }

    /* =====================================================================
       ENQUIRY FORM
       ===================================================================== */
    var enquiryForm = $('enquiryForm');

    if (enquiryForm) {
        var status = $('enquiry-status');
        var events = window.RootsEvents ? window.RootsEvents.upcoming() : [];
        var params = new URLSearchParams(window.location.search);

        // Fill the workshop drop-down from the shared events data
        var eventSelect = $('enq-event');
        events.forEach(function (ev) {
            var o = document.createElement('option');
            o.value = ev.id;
            o.textContent = ev.title + ' - ' + window.RootsEvents.formatDate(ev.date) + ' (' + ev.location + ')';
            eventSelect.appendChild(o);
        });

        $('enq-qty').required = true;
        $('enq-amount').required = true;
        $('enq-attendees').required = true;

        // Show only the fields that belong to the chosen enquiry type
        function showFields(type) {
            ['volunteer', 'sponsor', 'partner', 'workshop'].forEach(function (t) { $(t + '-fields').hidden = (t !== type); });
        }

        Array.prototype.forEach.call(enquiryForm.querySelectorAll('input[name="enquiry-type"]'), function (radio) {
            radio.addEventListener('change', function () {
                showFields(radio.value);
                validateRadios(enquiryForm);
            });
        });

        // Sponsorship: "general donation" uses an amount instead of a quantity
        $('enq-package').addEventListener('change', function () {
            var general = this.value === 'general';
            $('enq-qty-group').hidden = general;
            $('enq-amount-group').hidden = !general;
            $('enq-qty').max = this.value === 'garden' ? 12 : 50;
            $('enq-qty').nextElementSibling.textContent = this.value === 'garden' ? 'Between 1 and 12 (we run twelve gardens).' : 'Between 1 and 50.';
        });

        // The date picker should not offer past dates
        var iso = new Date(); iso.setMinutes(iso.getMinutes() - iso.getTimezoneOffset());
        $('enq-start').min = iso.toISOString().slice(0, 10);

        // Pre-fill from a link such as enquiry.html?type=workshop&event=e3
        var preType = params.get('type');
        if (['volunteer', 'sponsor', 'partner', 'workshop'].indexOf(preType) !== -1) {
            var pre = enquiryForm.querySelector('input[name="enquiry-type"][value="' + preType + '"]');
            pre.checked = true;
            showFields(preType);
            var tab = $('tab-' + preType);
            if (tab) { tab.click(); }
            if (params.get('event') && eventSelect.querySelector('option[value="' + params.get('event') + '"]')) { eventSelect.value = params.get('event'); }
            var g = params.get('garden');
            if (g) { $('enq-garden').value = g; }
        }

        attachLiveValidation(enquiryForm);

        /* ---- Build the cost / availability response ---- */
        function nextGardenDays(location, limit) {
            return events.filter(function (e) { return e.type === 'Garden day' && (!location || e.location === location); })
                .sort(function (a, b) { return a.date.localeCompare(b.date); }).slice(0, limit || 1);
        }

        function buildResponse(data) {
            var fmt = window.RootsEvents.formatDate;
            var r = { title: '', rows: [], total: '', notes: [], kind: 'ok' };
            r.rows.push(['Name', data['full-name']]);

            if (data['enquiry-type'] === 'volunteer') {
                r.title = 'Volunteer enquiry received';
                r.rows.push(['Garden', data.garden]);
                r.rows.push(['Availability', data.availability]);
                if (data['start-date']) { r.rows.push(['Preferred start', fmt(data['start-date'])]); }
                r.total = 'Cost: Free - volunteering costs nothing.';
                var days = nextGardenDays(data.garden, 1);
                if (days.length) {
                    r.notes.push('Next garden day at ' + data.garden + ': ' + fmt(days[0].date) + ' at ' + days[0].time + ' (' + days[0].spots + ' places available).');
                } else {
                    r.notes.push('No garden day is scheduled at ' + data.garden + ' yet. Our volunteer coordinator will propose a first session.');
                }
                r.notes.push('Induction and training are provided on your first day.');
            } else if (data['enquiry-type'] === 'sponsor') {
                var pkg = data['sponsorship-type'];
                r.title = 'Your sponsorship estimate';
                r.rows.push(['Option', PACKAGE_LABELS[pkg]]);
                var total;
                if (pkg === 'general') {
                    total = parseInt(data.amount, 10);
                    r.rows.push(['Amount', money(total)]);
                } else {
                    var qty = parseInt(data.quantity, 10);
                    total = PRICES[pkg] * qty;
                    r.rows.push(['Quantity', String(qty)]);
                    r.rows.push(['Unit price', money(PRICES[pkg])]);
                }
                if (data.organisation) { r.rows.push(['Organisation', data.organisation]); }
                r.total = 'Estimated total: ' + money(total);
                r.notes.push(pkg === 'garden' ? 'Each garden sponsorship covers seeds, tools and monthly advisor visits for one garden for a year.' : 'Your contribution goes directly to garden equipment, seeds and learning materials.');
                r.notes.push('Availability: sponsorship places are open. We will email payment details after confirming your enquiry.');
            } else if (data['enquiry-type'] === 'partner') {
                r.title = 'Partnership enquiry received';
                r.rows.push(['Company', data.company]);
                var size = parseInt(data['team-size'], 10);
                if (size) {
                    var sites = Math.ceil(size / 20);
                    r.rows.push(['Team size', String(size)]);
                    r.total = 'Cost: Free - team volunteering days are free of charge.';
                    r.notes.push('We recommend ' + sites + ' garden site' + (sites > 1 ? 's' : '') + ' (up to 20 people per site).');
                    var opts = nextGardenDays('', 2);
                    if (opts.length) {
                        r.notes.push('Earliest garden days: ' + opts.map(function (e) { return fmt(e.date) + ' (' + e.location + ')'; }).join(' or ') + '.');
                    }
                } else {
                    r.total = 'Cost: depends on the partnership.';
                    r.notes.push('Our CSI contact will call you to discuss a partnership that suits your company.');
                }
                r.notes.push('You will receive a social impact report for your stakeholders.');
            } else {
                var ev = events.filter(function (e) { return e.id === data.event; })[0];
                var places = parseInt(data.attendees, 10);
                r.title = 'Registration enquiry';
                r.rows.push(['Event', ev.title]);
                r.rows.push(['When', fmt(ev.date) + ' at ' + ev.time]);
                r.rows.push(['Where', ev.location]);
                r.rows.push(['Places requested', String(places)]);
                r.total = 'Cost: ' + (ev.price === 0 ? 'Free' : money(ev.price * places) + ' (' + money(ev.price) + ' per person)');
                if (ev.spots === 0) {
                    r.kind = 'warn';
                    r.notes.push('This event is fully booked. We have added you to the waiting list and will email you if a place opens.');
                } else if (ev.spots < places) {
                    r.kind = 'warn';
                    r.notes.push('Only ' + ev.spots + ' place' + (ev.spots === 1 ? ' is' : 's are') + ' left. We can reserve ' + ev.spots + ' now and waitlist the rest.');
                } else {
                    r.notes.push('Good news: ' + places + ' of ' + ev.spots + ' remaining places are available for you.');
                }
            }
            if (data.message) { r.rows.push(['Your message', data.message.length > 120 ? data.message.slice(0, 117) + '...' : data.message]); }
            return r;
        }

        function collect(form) {
            var data = {};
            Array.prototype.forEach.call(form.elements, function (f) {
                if (!f.name || f.name === 'bot-field' || f.name === 'form-name') { return; }
                if (f.type === 'radio' && !f.checked) { return; }
                if (f.closest('[hidden]')) { return; }
                data[f.name] = f.value.trim();
            });
            return data;
        }

        function showResponse(r, delivered, errorNote) {
            var body = document.createElement('div');
            body.appendChild(el('p', null, 'Thank you for your enquiry. Here is what we have worked out for you:'));
            var dl = el('dl');
            r.rows.forEach(function (row) { dl.appendChild(el('dt', null, row[0])); dl.appendChild(el('dd', null, row[1])); });
            body.appendChild(dl);
            body.appendChild(el('p', 'modal__total', r.total));
            r.notes.forEach(function (n) { body.appendChild(el('p', null, n)); });
            body.appendChild(el('p', 'modal__note', delivered
                ? 'Your enquiry has been sent. Our team will confirm within 2 business days.'
                : errorNote));
            window.RootsUI.openModal({ title: r.title, body: body });
        }

        /* ---- Submit: validate, respond, send with AJAX ---- */
        enquiryForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var result = validateForm(enquiryForm);
            if (result.errors) { failSummary(enquiryForm, status, result); return; }
            setStatus(status, '', '');

            var data = collect(enquiryForm);
            var response = buildResponse(data);
            var button = $('enquiry-submit');
            button.disabled = true;
            button.textContent = 'Sending...';

            // AJAX submission (asynchronous, the page does not reload). Netlify Forms receives the POST.
            var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
            var timer = controller ? setTimeout(function () { controller.abort(); }, 8000) : null;
            fetch('/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(new FormData(enquiryForm)).toString(),
                signal: controller ? controller.signal : undefined
            }).then(function (res) {
                if (!res.ok) { throw new Error('HTTP ' + res.status); }
                showResponse(response, true);
                enquiryForm.reset();
                showFields('');
                Array.prototype.forEach.call(enquiryForm.querySelectorAll('.is-valid, .is-invalid'), function (f) { f.classList.remove('is-valid', 'is-invalid'); });
                setStatus(status, 'Enquiry sent successfully. Thank you!', 'ok');
            }).catch(function () {
                showResponse(response, false, 'We could not send your enquiry online just now. Your details are still in the form - please try again, or email ' + RECIPIENT + '.');
                setStatus(status, 'Your enquiry was not delivered. Please try again or email ' + RECIPIENT + '.', 'warn');
            }).then(function () {
                if (timer) { clearTimeout(timer); }
                button.disabled = false;
                button.textContent = 'Submit Enquiry';
            });
        });
    }

    /* =====================================================================
       CONTACT FORM - compiles an email and lets the visitor send it
       ===================================================================== */
    var contactForm = $('contactForm');

    if (contactForm) {
        var cStatus = $('contact-status');
        var counter = $('con-count');
        var msgField = $('con-message');

        attachLiveValidation(contactForm);
        msgField.addEventListener('input', function () { counter.textContent = msgField.value.length; });

        function composeEmail() {
            var type = $('con-type').value;
            var subject = $('con-subject').value.trim();
            var phone = $('con-phone').value.trim();
            var lines = [
                'Name: ' + $('con-name').value.trim(),
                'Email: ' + $('con-email').value.trim(),
                'Phone: ' + (phone || 'not provided'),
                'Message type: ' + type,
                '',
                msgField.value.trim()
            ];
            return {
                to: RECIPIENT,
                subject: '[Website] ' + type + (subject ? ' - ' + subject : ''),
                body: lines.join('\n')
            };
        }

        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var result = validateForm(contactForm);
            if (result.errors) { failSummary(contactForm, cStatus, result); return; }
            setStatus(cStatus, '', '');

            var mail = composeEmail();
            var href = 'mailto:' + mail.to + '?subject=' + encodeURIComponent(mail.subject) + '&body=' + encodeURIComponent(mail.body).replace(/%0A/g, '%0D%0A');

            var body = document.createElement('div');
            body.appendChild(el('p', null, 'Your message has been checked and compiled into an email. Review it, then open it in your email app to send it.'));
            var dl = el('dl');
            dl.appendChild(el('dt', null, 'To')); dl.appendChild(el('dd', null, mail.to));
            dl.appendChild(el('dt', null, 'Subject')); dl.appendChild(el('dd', null, mail.subject));
            body.appendChild(dl);
            body.appendChild(el('pre', null, mail.body));

            var send = el('a', 'btn btn--green', 'Open in my email app');
            send.href = href;
            send.addEventListener('click', function () {
                setStatus(cStatus, 'Your email app should now be open. Press Send there to deliver your message.', 'ok');
            });
            var copy = el('button', 'btn btn--outline', 'Copy message');
            copy.type = 'button';
            copy.addEventListener('click', function () {
                var text = 'To: ' + mail.to + '\nSubject: ' + mail.subject + '\n\n' + mail.body;
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(function () { copy.textContent = 'Copied!'; }, function () { copy.textContent = 'Copy failed'; });
                } else { copy.textContent = 'Copy not supported'; }
            });

            window.RootsUI.openModal({ title: 'Review your email', body: body, actions: [send, copy] });
        });
    }
})();
