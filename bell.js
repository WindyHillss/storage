// ==UserScript==
// @name         Bell
// @namespace    http://tampermonkey.net/
// @version      0.0
// @downloadURL  https://raw.githubusercontent.com/WindyHillss/storage/main/bell.js
// @updateURL    https://raw.githubusercontent.com/WindyHillss/storage/main/bell.js
// @description  Add-ons that may be useful in Hordes.io
// @author       WindyHills
// @match        https://hordes.io/play
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
	
	// change chunk
    const originalFetch = window.fetch;
    window.fetch = async function(resource, init) {
        const url = typeof resource === "string" ? resource : resource.url;
        if (url.includes("6566")) {
            return originalFetch("https://raw.githubusercontent.com/WindyHillss/storage/main/6566", init);
        }
        return originalFetch(resource, init);
    };

    // settings values
    let settings = {
        autoOpen: true,
        chatRemake: true,
        removeLevelBar: true,
        removeEntityPanel: true,
        removeInventoryFilter: true,
        removeUpgradeButton: true,
        removeBarTexts: true,
        partyTransition: true,
        mentionHighlight: true
    };

    // remove elements
    let processing = false;

    function removeelements() {

        // level
        if (settings.removeLevelBar) {
            document.querySelectorAll('.container.svelte-1m0q37p')
            .forEach(element => element.remove());
        }

        // entity
        if (settings.removeEntityPanel) {
            document.querySelectorAll('.panel-black.container.svelte-1wip79f')
            .forEach(element => element.remove());
        }

        // inventory
        if (settings.removeInventoryFilter) {
            document.querySelectorAll('.filter.svelte-ha50yv')
            .forEach(element => element.remove());
        }

        // upgrade button
        if (settings.removeUpgradeButton) {
            document.querySelectorAll('.btn.textwhite').forEach(element => {
                if (element.textContent.trim() === 'Upgrade') {
                    element.remove();
                }
            });
        }

		// remove ... texts
		if (settings.removeBarTexts) {
				document.querySelectorAll('.marg-top.bar.btn.black.grey.svelte-nijy6x')
					.forEach(parent => {

				parent.querySelectorAll('.textyellow, .textorange, .textpurp')
					.forEach(element => element.remove());

				// copy MS value WEEEEeee
				const msElement = parent.querySelector('.textcyan');

				if (msElement && !msElement.dataset.bellBound) {
					msElement.dataset.bellBound = "1";
					msElement.style.cursor = "pointer";

					msElement.addEventListener("click", async () => {
						const ms = msElement.textContent.trim();

						try {
							await navigator.clipboard.writeText(`${ms}`);
						} catch (err) {
							console.error("Clipboard error:", err);
						}
					});
				}
			});
		}
    }

    // add to chat > & Remove time
    function chatremake() {
		if (!settings.chatRemake) return;
        // add " > "
        let senderElements = document.querySelectorAll('.sender.svelte-7c1tlw');

        senderElements.forEach(sender => {
            if (!sender.querySelector('#textf0, #textf1')) {

                const hasTextF1 = sender.querySelector('.textf1');

                let newSpan = document.createElement('span');
                newSpan.id = hasTextF1 ? 'textf1' : 'textf0';
                newSpan.className = hasTextF1 ? 'textf1' : 'textf0';
                newSpan.innerHTML = '&gt; ';

                sender.appendChild(newSpan);
            }
        });

        // remove time rlly simple yup yup
        let elements1 = document.querySelectorAll('.time.svelte-7c1tlw');

        elements1.forEach(element => element.remove());
    }

    // party entrance transition
    function partyEntranceTransition() {
        if (!settings.partyTransition) return;

        if (!document.getElementById("bell-party-style")) {
            const style = document.createElement("style");
            style.id = "bell-party-style";
            style.textContent = `
                .partyframes.svelte-1xmlhk>.grid>* {
                    opacity: 0;
                    transform: translateX(-80px);
                    transition:
                        transform .55s cubic-bezier(.22,1,.36,1),
                        opacity .35s ease;
                    will-change: transform, opacity;
                }
                .partyframes.svelte-1xmlhk>.grid.tm-show>* {
                    opacity: 1;
                    transform: none;
                }
            `;
            (document.head || document.documentElement).appendChild(style);
        }

        document.querySelectorAll(".partyframes.svelte-1xmlhk").forEach(frame => {
            [...frame.children].forEach((el, index) => {
                if (!el.classList.contains("grid")) return;
                if (el.dataset.tmAnimated) return;
                el.dataset.tmAnimated = "1";
                setTimeout(() => {
                    el.classList.add("tm-show");
                }, index * 100);
            });
        });
    }

    // mention highlighter + ping
    const HIGHLIGHT_CLASS = "bell-mention-highlight";
    let mentionAudioCtx = null;
    let mentionLastPing = 0;

    function mentionPlayPing() {
        const now = Date.now();
        if (now - mentionLastPing < 800) return;
        mentionLastPing = now;
        try {
            if (!mentionAudioCtx)
                mentionAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (mentionAudioCtx.state === "suspended")
                mentionAudioCtx.resume();
            const osc = mentionAudioCtx.createOscillator();
            const gain = mentionAudioCtx.createGain();
            osc.type = "sine";
            osc.frequency.value = 1100;
            gain.gain.setValueAtTime(0.18, mentionAudioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, mentionAudioCtx.currentTime + 0.18);
            osc.connect(gain);
            gain.connect(mentionAudioCtx.destination);
            osc.start();
            osc.stop(mentionAudioCtx.currentTime + 0.18);
        } catch (e) {}
    }

    function mentionGetPlayerNames() {
        try {
            const data = JSON.parse(localStorage.getItem("skillbarsettings") || "{}");
            return Object.keys(data);
        } catch { return []; }
    }

    function mentionEscapeRegExp(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function mentionHighlightLine(line, playSound) {
        if (!settings.mentionHighlight) return;

        const names = mentionGetPlayerNames();
        if (!names.length) return;

        const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT, null);
        const textNodes = [];
        while (walker.nextNode()) textNodes.push(walker.currentNode);

        for (const node of textNodes) {
            if (node.parentElement && node.parentElement.classList.contains(HIGHLIGHT_CLASS)) continue;

            let text = node.nodeValue;
            let changed = false;
            const frag = document.createDocumentFragment();

            while (text.length) {
                let earliest = Infinity;
                let matchedName = null;
                let matchedText = null;

                for (const name of names) {
                    const regex = new RegExp(`@${mentionEscapeRegExp(name)}(?=$|\\s|[!?,.:;()\\[\\]{}"'<>])`);
                    const match = regex.exec(text);
                    if (match && match.index < earliest) {
                        earliest = match.index;
                        matchedName = name;
                        matchedText = match[0];
                    }
                }

                if (!matchedName) {
                    frag.appendChild(document.createTextNode(text));
                    break;
                }

                if (earliest > 0)
                    frag.appendChild(document.createTextNode(text.slice(0, earliest)));

                const span = document.createElement("span");
                span.className = HIGHLIGHT_CLASS;
                span.textContent = matchedText;
                frag.appendChild(span);

                if (playSound) mentionPlayPing();

                text = text.slice(earliest + matchedText.length);
                changed = true;
            }

            if (changed) node.replaceWith(frag);
        }
    }

    function mentionHighlighter() {
        if (!document.getElementById("bell-mention-style")) {
            const style = document.createElement("style");
            style.id = "bell-mention-style";
            style.textContent = `
                .${HIGHLIGHT_CLASS} {
                    color: #ffac38 !important;
                }
            `;
            document.head.appendChild(style);
        }

        const chat = document.querySelector("#chat");
        if (!chat) return;

        if (chat.dataset.bellMentionObserved) return;
        chat.dataset.bellMentionObserved = "1";

        chat.querySelectorAll("article.line").forEach(line => {
            if (line.dataset.bellMentionDone) return;
            line.dataset.bellMentionDone = "1";
            mentionHighlightLine(line, false);
        });

        const observer = new MutationObserver(mutations => {
            if (!settings.mentionHighlight) return;
            for (const mutation of mutations) {
                mutation.addedNodes.forEach(node => {
                    if (!(node instanceof HTMLElement)) return;
                    if (node.matches("article.line")) {
                        if (node.dataset.bellMentionDone) return;
                        node.dataset.bellMentionDone = "1";
                        mentionHighlightLine(node, true);
                    }
                    node.querySelectorAll?.("article.line").forEach(line => {
                        if (line.dataset.bellMentionDone) return;
                        line.dataset.bellMentionDone = "1";
                        mentionHighlightLine(line, true);
                    });
                });
            }
        });

        observer.observe(chat, { childList: true, subtree: true });
    }
	
    // auto container opener
    function clickSpecificButton() {
		if (!settings.autoOpen) return;

        const buttons = document.querySelectorAll('.btn.border.black.textgreen');

        buttons.forEach(function (button) {
            if (button.textContent.trim() === 'Yes, open my Stash.') {
                button.click();
            };

            if (button.textContent.trim() === 'Show me your wares.') {
                button.click();
            };

            if (button.textContent.trim() === 'Yes, I have some items.') {
                button.click();
            };

            if (button.textContent.trim() === 'Yes, show me the items for sale.') {
                button.click();
            };
        });
    };

    // settings
    function saveSettings() {
        localStorage.setItem('bellSettings', JSON.stringify(settings));
    }

    // add custom settings menu
    function addBellSettings() {

        const settingsRoot = document.querySelector('.divide.svelte-13nnce4');

        if (!settingsRoot) return;

        const existingButton = document.querySelector('#bell-settings-button');

        if (existingButton) {
            const existingContent = document.getElementById('bell-settings-panel');
            if (existingContent && !existingButton.classList.contains('active')) {
                existingContent.style.display = 'none';
            }
            return;
        }

        // buttons
        const choices = settingsRoot.children[0];

        const button = document.createElement('div');

        button.className = 'choice';

        button.id = 'bell-settings-button';

        button.textContent = 'Bell';

        choices.appendChild(button);

        // existing panel
        const menu = settingsRoot.querySelector('.menu.panel-black');

        if (!menu) return;

        // content
        const content = document.createElement('div');

        content.id = 'bell-settings-panel';

		content.style.display = 'none';
		content.style.height = "100%";
		content.style.flexDirection = "column";
		content.style.position = "relative";

        const IMAGE_BASE = "https://raw.githubusercontent.com/WindyHillss/storage/main/";

        const settingItems = [
			{
                key: "autoOpen",
                id: "bell-auto-open",
                label: "Skip interaction dialogs",
                image: IMAGE_BASE + "autoOpen.png"
            },
			{
                key: "chatRemake",
                id: "bell-chat",
                label: "Chat remake",
                image: IMAGE_BASE + "chatRemake.png"
            },
			{
                key: "removeLevelBar",
                id: "bell-remove-level-bar",
                label: "Remove experience bar",
                image: IMAGE_BASE + "removeLevelBar.png"
            },
			{
                key: "removeEntityPanel",
                id: "bell-remove-entity-panel",
                label: "Remove entity panel",
                image: IMAGE_BASE + "removeEntityPanel.png"
            },
			{
                key: "removeInventoryFilter",
                id: "bell-remove-inventory-filter",
                label: "Remove inventory filter box",
                image: IMAGE_BASE + "removeInventoryFilter.png"
            },
			{
                key: "removeUpgradeButton",
                id: "bell-remove-upgrade-button",
                label: "Remove upgrd button from stash",
                image: IMAGE_BASE + "removeUpgradeButton.png"
            },
			{
                key: "removeBarTexts",
                id: "bell-remove-bar-texts",
                label: "Debug panel remake",
                image: IMAGE_BASE + "removeBarTexts.png"
            },
			{
                key: "partyTransition",
                id: "bell-party-transition",
                label: "Party entrance transition",
				desc: "A smooth scroll"
            },
			{
                key: "mentionHighlight",
                id: "bell-mention-highlight",
                label: "User ping",
                image: IMAGE_BASE + "mentionHighlight.png",
                desc: "Requires reload"
            }
        ];

		content.innerHTML = `
			<h3 class="textprimary">Bell settings</h3>

			<div class="settings svelte-13nnce4" style="flex:0;">
				${settingItems.map(setting => `
					<div>${setting.label}${setting.desc ? `<br><small class="textgrey">${setting.desc}</small>` : ''}</div>
					<div
						class="btn checkbox ${settings[setting.key] ? 'active' : ''}"
						id="${setting.id}">
					</div>
				`).join('')}
			</div>
		`;

		const preview = document.createElement("div");

		preview.id = "bell-preview";

		preview.style.cssText = `
			position: fixed;
			display: none;
			pointer-events: none;
			z-index: 999999;
			background: rgba(0,0,0,.75);
			padding: 4px;
			border: 1px solid #0e1015;
			border-radius: 4px;
		`;

		preview.innerHTML = `
			<img id="bell-preview-img"
				 style="display:block;width:220px;height:auto;border-radius:3px;">
		`;

		document.body.appendChild(preview);

		// footer
		const footer = document.createElement("div");

		footer.style.cssText = `
			position: absolute;
			right: 5px;
			bottom: 5px;
			font-size: 11px;
			color: #999;
			user-select: none;
		`;

		footer.innerHTML = `
			Addon created by <span id="bell-windy" style="color:#c0c0c0;cursor:pointer;">WindyHills</span>
		`;

		content.appendChild(footer);

        menu.appendChild(content);

        // button functionality
        settingItems.forEach(setting => {

            const btn = document.getElementById(setting.id);

            if (!btn) return;

            btn.addEventListener("click", () => {
                settings[setting.key] = !settings[setting.key];
                btn.classList.toggle("active");
                saveSettings();
            });

            // hover
            btn.addEventListener("mouseenter", (e) => {
                if (!setting.image) return;

                const img = preview.querySelector("#bell-preview-img");

                img.src = setting.image;

                preview.style.left = (e.clientX + 20) + "px";
                preview.style.top = (e.clientY - 20) + "px";

                preview.style.display = "block";
            });

            btn.addEventListener("mousemove", (e) => {

                preview.style.left = (e.clientX + 20) + "px";
                preview.style.top = (e.clientY - 20) + "px";

            });

            btn.addEventListener("mouseleave", () => {

                preview.style.display = "none";

            });

        });
        // open panel
        button.addEventListener(
            'click',
            () => {

            choices
            .querySelectorAll('.choice')
            .forEach(x =>
                x.classList.remove('active'));

            button.classList.add(
                'active');

            menu
            .querySelectorAll(
                ':scope > *')
            .forEach(x => {

                if (
                    x.id !==
                    'bell-settings-panel') {
                    x.style.display =
                        'none';
                }

            });

            content.style.display =
                'flex';

        });

        // return normal
        choices
        .querySelectorAll(
            '.choice:not(#bell-settings-button)')
        .forEach(btn => {

            btn.addEventListener(
                'click',
                () => {

                // remove active from bell
                button.classList.remove(
                    'active');

                // hide bell content
                content.style.display =
                    'none';

                // restore normal menu
                menu
                .querySelectorAll(
                    ':scope > *')
                .forEach(x => {

                    if (
                        x.id !==
                        'bell-settings-panel') {
                        x.style.display =
                            '';
                    }

                });

            });

        });

    }

    function main() {
        if (processing) return;
        processing = true;
        requestAnimationFrame(() => {
            clickSpecificButton();
            chatremake();
            removeelements();
            partyEntranceTransition();
            mentionHighlighter();
            addBellSettings();
            processing = false;
        });
    };

    // observer
    const observer = new MutationObserver(() => {
        main();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // load settings from localStorage
    function loadSettings() {
        const saved = localStorage.getItem('bellSettings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                settings = {
                    ...settings,
                    ...parsed
                };
            } catch (e) {
                console.error('Settings load error:', e);
            }
        }
    }

    // load settings at startup
    loadSettings();

	// version check
	const CURRENT_VERSION = "0.7";
	const CHECK_URL = "https://raw.githubusercontent.com/WindyHillss/storage/main/version.txt";

	function showUpdateBanner(text) {
		const old = document.getElementById("bell-update-banner");
		if (old) old.remove();

		const banner = document.createElement("div");
		banner.id = "bell-update-banner";

		banner.textContent = text;

		Object.assign(banner.style, {
			position: "fixed",
			top: "20px",
			left: "50%",
			transform: "translateX(-50%) translateY(-20px)",
			background: "rgba(20,20,20,0.92)",
			color: "#999",
			padding: "14px 22px",
			borderRadius: "4px",
			fontSize: "14px",
			fontWeight: "600",
			zIndex: "1",
			boxShadow: "0 8px 24px rgba(0,0,0,.25)",
			opacity: "0",
			transition: "all .35s ease"
		});

		document.body.appendChild(banner);

		requestAnimationFrame(() => {
			banner.style.opacity = "1";
			banner.style.transform = "translateX(-50%) translateY(0)";
		});

		setTimeout(() => {
			banner.style.opacity = "0";
			banner.style.transform = "translateX(-50%) translateY(-20px)";

			setTimeout(() => banner.remove(), 350);
		}, 6000);
	}

	async function checkForUpdates() {
		try {
			const response = await fetch(CHECK_URL);
			const latestVersion = (await response.text()).trim();

			if (latestVersion > CURRENT_VERSION) {
				showUpdateBanner(
					`Bell ${latestVersion} is available!\n\nPlease update it via Tampermonkey.`
				);
			}
		} catch (e) {
			console.error("Update check failed:", e);
		}
	}

	checkForUpdates();

    console.log('Bell '+ CURRENT_VERSION +' Live')
})();
