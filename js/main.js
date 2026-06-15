/* =================================================================
   Naoya Iwamoto — Portfolio interactions (vanilla JS)
   Mobile nav toggle · active-link highlight · scroll reveal
   ================================================================= */
(function () {
    "use strict";

    var toggle = document.getElementById("navToggle");
    var links = document.getElementById("navLinks");

    /* Language switch — English is default; Japanese via ?lang=jp */
    var langToggle = document.getElementById("langToggle");

    function normalizeLang(v) {
        if (v === "jp" || v === "ja") return "ja";
        if (v === "en") return "en";
        return null;
    }

    function applyLang(lang) {
        var ja = lang === "ja";
        document.body.classList.toggle("lang-ja", ja);
        document.body.classList.toggle("lang-en", !ja);
        document.documentElement.lang = ja ? "ja" : "en";
    }

    // Initial language: ?lang= param > saved choice > default English
    var params = new URLSearchParams(window.location.search);
    var initialLang = normalizeLang(params.get("lang"));
    if (!initialLang) {
        try { initialLang = normalizeLang(localStorage.getItem("lang")); } catch (e) {}
    }
    applyLang(initialLang || "en");

    if (langToggle) {
        langToggle.addEventListener("click", function (e) {
            var btn = e.target.closest("button[data-lang]");
            if (!btn) return;
            var lang = normalizeLang(btn.getAttribute("data-lang"));
            if (!lang) return;
            applyLang(lang);
            var token = lang === "ja" ? "jp" : "en";
            try { localStorage.setItem("lang", token); } catch (err) {}
            // Reflect in URL without reloading (English is default → clean URL)
            var url = new URL(window.location.href);
            if (lang === "ja") { url.searchParams.set("lang", "jp"); }
            else { url.searchParams.delete("lang"); }
            window.history.replaceState(null, "", url);
        });
    }

    /* Render publications & activities from JSON data files ------- */
    var SELF_NAMES = ["Naoya Iwamoto", "岩本 尚也"];

    function esc(str) {
        return String(str == null ? "" : str)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    // Wrap occurrences of the self-name in a highlight span (operates on escaped text)
    function highlightSelf(escaped) {
        SELF_NAMES.forEach(function (name) {
            var safe = esc(name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            escaped = escaped.replace(
                new RegExp(safe, "g"),
                '<span class="font_line">' + esc(name) + "</span>"
            );
        });
        return escaped;
    }

    function linkTags(links) {
        if (!links || !links.length) return "";
        var parts = links.map(function (l) {
            return '[ <a href="' + esc(l.url) + '" target="_blank" rel="noopener">' +
                esc(l.label || "Link") + "</a> ]";
        });
        return " " + parts.join(" ");
    }

    function renderInto(id, items, buildHTML) {
        var ul = document.getElementById(id);
        if (!ul) return;
        ul.innerHTML = items.map(function (item) {
            var cls = item.lang === "ja" ? ' class="jp-only"' : "";
            return "<li" + cls + ">" + buildHTML(item) + "</li>";
        }).join("");
    }

    function loadJSON(url) {
        return fetch(url).then(function (r) {
            if (!r.ok) throw new Error(url + " -> " + r.status);
            return r.json();
        });
    }

    // Shared builder for Works / Private Project cards
    function workCardsInto(id, items) {
        var box = document.getElementById(id);
        if (!box) return;
        box.innerHTML = items.map(function (p) {
            var meta = p.meta ? '<span class="work-meta">' + esc(p.meta) + "</span>" : "";
            return '<a class="work-card" href="' + esc(p.url) + '" target="_blank" rel="noopener">' +
                '<div class="work-bg" style="background-image:url(\'' + esc(p.image) + '\')"></div>' +
                '<div class="work-overlay"><h3>' + esc(p.title) + "</h3>" + meta + "</div>" +
            "</a>";
        }).join("");
    }

    loadJSON("data/works.json")
        .then(function (items) { workCardsInto("worksList", items); })
        .catch(function (e) { console.error("Failed to load works:", e); });

    loadJSON("data/private-projects.json")
        .then(function (items) { workCardsInto("privateList", items); })
        .catch(function (e) { console.error("Failed to load private projects:", e); });

    loadJSON("data/cv.json")
        .then(function (subsections) {
            var box = document.getElementById("cvList");
            if (!box) return;
            box.innerHTML = subsections.map(function (sub) {
                var lis = sub.items.map(function (it) {
                    var cls = it.lang === "ja" ? ' class="jp-only"' : "";
                    var link = it.url ? linkTags([{ url: it.url, label: "Link" }]) : "";
                    return "<li" + cls + ">" + esc(it.text) + link + "</li>";
                }).join("");
                var inner = '<h3 class="subsection-title">' + esc(sub.heading) + "</h3>" +
                    '<ul class="info-list">' + lis + "</ul>";
                return sub.lang === "ja" ? '<div class="jp-only">' + inner + "</div>" : inner;
            }).join("");
        })
        .catch(function (e) { console.error("Failed to load CV:", e); });

    loadJSON("data/biography.json")
        .then(function (items) {
            var box = document.getElementById("biographyList");
            if (!box) return;
            box.innerHTML = items.map(function (b) {
                return '<div class="timeline-item">' +
                    '<span class="timeline-year">' + esc(b.year) + "</span>" +
                    '<div class="timeline-detail">' +
                        '<span class="timeline-role">' + esc(b.role) + "</span>" +
                        '<span class="timeline-place">' + esc(b.place) + "</span>" +
                    "</div>" +
                "</div>";
            }).join("");
        })
        .catch(function (e) { console.error("Failed to load biography:", e); });

    function chipLinks(links) {
        if (!links || !links.length) return "";
        return links.map(function (l) {
            return '<a href="' + esc(l.url) + '" target="_blank" rel="noopener">' +
                esc(l.label || "Link") + "</a>";
        }).join("\n");
    }

    loadJSON("data/research.json")
        .then(function (projects) {
            var box = document.getElementById("researchList");
            if (!box) return;
            box.innerHTML = projects.map(function (p) {
                var img = '<img src="' + esc(p.image) + '" alt="' + esc(p.alt || "") + '">';
                var thumb = p.url
                    ? '<a href="' + esc(p.url) + '" target="_blank" rel="noopener">' + img + "</a>"
                    : img;
                var links = p.links && p.links.length
                    ? '<p class="link-row">' + chipLinks(p.links) + "</p>" : "";
                return '<article class="research-card">' +
                    '<div class="research-thumb">' + thumb + "</div>" +
                    '<div class="research-info">' +
                        "<h3>" + esc(p.title) + "</h3>" +
                        '<p class="research-authors">' + highlightSelf(esc(p.authors)) + "</p>" +
                        '<p class="research-venue">' + esc(p.venue) + "</p>" +
                        links +
                    "</div>" +
                "</article>";
            }).join("");
        })
        .catch(function (e) { console.error("Failed to load research projects:", e); });

    loadJSON("data/publications.json")
        .then(function (pubs) {
            renderInto("pubList", pubs, function (p) {
                return highlightSelf(esc(p.authors)) + ", " +
                    '<span class="font_bold">' + esc(p.title) + "</span>, " +
                    '<span class="font_italic">' + esc(p.venue) + "</span>" +
                    linkTags(p.links);
            });
        })
        .catch(function (e) { console.error("Failed to load publications:", e); });

    loadJSON("data/activities.json")
        .then(function (acts) {
            renderInto("activityList", acts, function (a) {
                var cat = "";
                if (a.category && a.category_en) {
                    // Show JP category in JP mode, EN category in EN mode
                    cat = '<span class="jp-only"> [' + esc(a.category) + "]</span>" +
                          '<span class="en-only"> [' + esc(a.category_en) + "]</span>";
                } else if (a.category) {
                    cat = " [" + esc(a.category) + "]";
                }
                var links = a.url ? linkTags([{ url: a.url, label: "Link" }]) : "";
                return esc(a.date) + cat + " " + esc(a.text) + links;
            });
        })
        .catch(function (e) { console.error("Failed to load activities:", e); });

    /* Mobile nav toggle ------------------------------------------- */
    if (toggle && links) {
        toggle.addEventListener("click", function () {
            var open = links.classList.toggle("open");
            toggle.classList.toggle("open", open);
            toggle.setAttribute("aria-expanded", open ? "true" : "false");
        });

        // Close the menu after tapping a link (mobile)
        links.querySelectorAll("a").forEach(function (a) {
            a.addEventListener("click", function () {
                links.classList.remove("open");
                toggle.classList.remove("open");
                toggle.setAttribute("aria-expanded", "false");
            });
        });
    }

    /* Active nav link on scroll ----------------------------------- */
    var navAnchors = Array.prototype.slice.call(
        document.querySelectorAll(".nav-links a")
    );
    var sections = navAnchors
        .map(function (a) {
            var id = a.getAttribute("href");
            return id && id.charAt(0) === "#" ? document.querySelector(id) : null;
        })
        .filter(Boolean);

    if (sections.length && "IntersectionObserver" in window) {
        var spy = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        var id = "#" + entry.target.id;
                        navAnchors.forEach(function (a) {
                            a.classList.toggle(
                                "active",
                                a.getAttribute("href") === id
                            );
                        });
                    }
                });
            },
            { rootMargin: "-45% 0px -50% 0px" }
        );
        sections.forEach(function (s) {
            spy.observe(s);
        });
    }

    /* Scroll reveal ----------------------------------------------- */
    var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    var prefersReduced =
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || !("IntersectionObserver" in window)) {
        reveals.forEach(function (el) {
            el.classList.add("is-visible");
        });
    } else {
        var revealObserver = new IntersectionObserver(
            function (entries, obs) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        obs.unobserve(entry.target);
                    }
                });
            },
            { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
        );
        reveals.forEach(function (el) {
            revealObserver.observe(el);
        });
    }
})();
