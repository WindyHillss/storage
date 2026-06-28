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

    // settings values
    let settings = {
        autoOpen: true,
        chatRemake: true,
        removeLevelBar: true,
        removeEntityPanel: true,
        removeInventoryFilter: true,
        removeUpgradeButton: true,
        removeBarTexts: true
    };

    // Remove elements
    function removeelements() {

        // Level
        if (settings.removeLevelBar) {
            document.querySelectorAll('.container.svelte-1m0q37p')
            .forEach(element => element.remove());
        }

        // Entity
        if (settings.removeEntityPanel) {
            document.querySelectorAll('.panel-black.container.svelte-1wip79f')
            .forEach(element => element.remove());
        }

        // Inventory
        if (settings.removeInventoryFilter) {
            document.querySelectorAll('.filter.svelte-ha50yv')
            .forEach(element => element.remove());
        }

        // Upgrade button
        if (settings.removeUpgradeButton) {
            document.querySelectorAll('.btn.textwhite').forEach(element => {
                if (element.textContent.trim() === 'Upgrade') {
                    element.remove();
                }
            });
        }

        // Remove ... texts
        if (settings.removeBarTexts) {
            document.querySelectorAll('.marg-top.bar.btn.black.grey.svelte-nijy6x')
            .forEach(parent => {
                parent.querySelectorAll('.textyellow, .textorange, .textpurp')
                .forEach(element => element.remove());
            });
        }
    }

    // Add to chat > & Remove time
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

    // Auto container opener
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

        if (document.querySelector('#bell-settings-button')) return;

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
		content.style.height = "95%";
		content.style.display = "flex";
		content.style.flexDirection = "column";

        const IMAGE_BASE = "https://raw.githubusercontent.com/WindyHillss/storage/main/";

        const settingItems = [
			{
                key: "autoOpen",
                id: "bell-auto-open",
                label: "Auto Container Open",
                image: IMAGE_BASE + "autoOpen.png"
            },
			{
                key: "chatRemake",
                id: "bell-chat",
                label: "Chat Remake",
                image: IMAGE_BASE + "chatRemake.png"
            },
			{
                key: "removeLevelBar",
                id: "bell-remove-level-bar",
                label: "Remove Level Bar",
                image: IMAGE_BASE + "removeLevelBar.png"
            },
			{
                key: "removeEntityPanel",
                id: "bell-remove-entity-panel",
                label: "Remove Entity Panel",
                image: IMAGE_BASE + "removeEntityPanel.png"
            },
			{
                key: "removeInventoryFilter",
                id: "bell-remove-inventory-filter",
                label: "Remove Inventory Filter Box",
                image: IMAGE_BASE + "removeInventoryFilter.png"
            },
			{
                key: "removeUpgradeButton",
                id: "bell-remove-upgrade-button",
                label: "Remove Upgrd Button from Stash",
                image: IMAGE_BASE + "removeUpgradeButton.png"
            },
			{
                key: "removeBarTexts",
                id: "bell-remove-bar-texts",
                label: "Show FPS / PING Remove Texts",
                image: IMAGE_BASE + "removeBarTexts.png"
            }
        ];

		content.innerHTML = `
			<h3 class="textprimary">Bell settings</h3>

			<div class="settings svelte-13nnce4" style="flex:1;">
				${settingItems.map(setting => `
					<div>${setting.label}</div>
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

		// Footer
		const footer = document.createElement("div");

		footer.style.cssText = `
			position: absolute;
			right: 10px;
			bottom: 0px;
			font-size: 11px;
			color: #999;
			user-select: none;
		`;

		footer.innerHTML = `
			Addon created by <span id="bell-windy" style="color:#c0c0c0;cursor:pointer;">WindyHills</span>
		`;

		content.style.position = "relative";
		content.appendChild(footer);

		// Informational note
		const infoNote = document.createElement("div");
		infoNote.style.cssText = `
			position: absolute;
			bottom: 0px;
			font-size: 11px;
			color: #999;
			user-select: none;
		`;
		infoNote.textContent = "Some settings may require a restart.";
		content.appendChild(infoNote);

		// Hover image
		const windyPreview = document.createElement("div");

		windyPreview.style.cssText = `
			position: fixed;
			display: none;
			pointer-events: none;
			z-index: 999;
			background: rgba(0,0,0,.8);
			padding: 4px;
			border: 1px solid #0e1015;
			border-radius: 4px;
		`;

		windyPreview.innerHTML = `
			<img src="https://raw.githubusercontent.com/WindyHillss/storage/main/norma.png"
				 style="display:block;width:220px;height:auto;border-radius:3px;">
		`;

		document.body.appendChild(windyPreview);

		const windy = footer.querySelector("#bell-windy");

		windy.addEventListener("mouseenter", e => {
			windyPreview.style.display = "block";
			windyPreview.style.left = (e.clientX + 20) + "px";
			windyPreview.style.top = (e.clientY - 210) + "px";
		});

		windy.addEventListener("mousemove", e => {
			windyPreview.style.left = (e.clientX + 20) + "px";
			windyPreview.style.top = (e.clientY - 210) + "px";
		});

		windy.addEventListener("mouseleave", () => {
			windyPreview.style.display = "none";
		});

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

            // Hover
            btn.addEventListener("mouseenter", (e) => {

                const img = preview.querySelector("#bell-preview-img");

                img.src = setting.image;

                // Sol üstte görünsün
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
                '';

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
        clickSpecificButton();

        chatremake();

        removeelements();

        // settings panel
        addBellSettings();
    };

    // observer
    const observer = new MutationObserver(() => {
        main();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Load settings from localStorage
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
	const CURRENT_VERSION = "0.6";
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