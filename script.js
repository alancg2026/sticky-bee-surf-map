"use strict";

const DATA_URL = "dados/pontos.geojson";
const STICKY_BEE_URL = "https://www.sbeesurf.com/";
const CATEGORY_LABELS = {
  surf: "Surf e praias",
  protegida: "Área protegida",
  iniciativa: "Iniciativa ambiental"
};
const CATEGORY_ICONS = {
  surf: '<path d="M3 15.5c2.3-2.1 4.7-2.1 7 0s4.7 2.1 7 0 4.7-2.1 7 0M3 20c2.3-2.1 4.7-2.1 7 0s4.7 2.1 7 0 4.7-2.1 7 0M4 10.5c4.2 0 6.8-2.1 8-6.5 2.4 4.4 5 6.5 8 6.5-2 2.1-4.7 3.2-8 3.2s-6-1.1-8-3.2Z" fill="none" stroke="#20211d" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>',
  protegida: '<path d="M12 2.5 20 5v6.2c0 5-3.3 8.5-8 10.8-4.7-2.3-8-5.8-8-10.8V5l8-2.5Z" fill="none" stroke="#fff" stroke-linejoin="round" stroke-width="1.8"/><path d="M8 14.8c.2-4.2 2.7-6.7 7.6-7.5-.1 4.9-2.6 7.4-7.6 7.5Zm0 0c1.7.1 3.4.8 4.7 2.2m0-2.2 2.4-3.2" fill="#fff" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6"/>',
  iniciativa: '<path d="M12 20.5v-8m0 3c-4.6 0-7-2.4-7-7 4.6 0 7 2.4 7 7Zm0-3c0-4.6 2.4-7 7-7 0 4.6-2.4 7-7 7Zm-5.5 8h11" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>'
};

const map = L.map("map", { scrollWheelZoom: true }).setView([-27.55, -48.55], 8);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const markerLayer = L.featureGroup().addTo(map);
const searchInput = document.getElementById("search");
const categorySelect = document.getElementById("category");
const municipalitySelect = document.getElementById("municipality");
const pointList = document.getElementById("point-list");
const resultCount = document.getElementById("results-count");
const resultMessage = document.getElementById("results-message");
const filtersForm = document.getElementById("filters");
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebar-toggle");
let points = [];
let markersById = new Map();

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function safeExternalUrl(value) {
  try {
    const url = new URL(String(value));
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch {
    return "";
  }
}

function categoryIconSvg(category, label, decorative = false) {
  const accessibility = decorative
    ? 'aria-hidden="true"'
    : `role="img" aria-label="${escapeHtml(label)}"`;
  return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" ${accessibility}>${CATEGORY_ICONS[category]}</svg>`;
}

function markerIcon(category, name) {
  const categoryLabel = CATEGORY_LABELS[category];
  const label = `${categoryLabel}: ${name}`;
  return L.divIcon({
    className: "",
    html: `<div class="bee-marker ${category}" title="${escapeHtml(label)}">${categoryIconSvg(category, label)}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -23]
  });
}

function popupContent(properties) {
  const fields = [
    ["Descrição", properties.descricao],
    ["Características", properties.caracteristicas],
    ["Movimento / frequência", properties.movimento],
    ["Experiência recomendada", properties.experiencia],
    ["Tipo de pico", properties.tipo_pico],
    ["Consistência", properties.consistencia]
  ].filter(([, value]) => value);

  const details = fields.map(([label, value]) =>
    `<p class="popup-details"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`
  ).join("");
  const officialUrl = safeExternalUrl(properties.link_oficial);
  const officialLink = officialUrl
    ? `<a class="popup-link" href="${escapeHtml(officialUrl)}" target="_blank" rel="noopener noreferrer">Link oficial ↗</a>`
    : "";
  const stickyLink = safeExternalUrl(properties.link_sticky_bee) || STICKY_BEE_URL;

  return `<article>
    <h2 class="popup-title">${escapeHtml(properties.nome)}</h2>
    <p class="popup-meta">${escapeHtml(properties.municipio)}${properties.regiao ? ` · ${escapeHtml(properties.regiao)}` : ""}</p>
    <span class="popup-category">${escapeHtml(CATEGORY_LABELS[properties.categoria] || properties.categoria)}</span>
    ${details}
    ${officialLink}
    <a class="popup-sticky-link" href="${escapeHtml(stickyLink)}" target="_blank" rel="noopener noreferrer">Conheça a Sticky Bee ↗</a>
  </article>`;
}

function createPoint(point) {
  const marker = L.marker(
    [point.geometry.coordinates[1], point.geometry.coordinates[0]],
    { icon: markerIcon(point.properties.categoria, point.properties.nome), title: `${CATEGORY_LABELS[point.properties.categoria]}: ${point.properties.nome}` }
  );
  marker.bindPopup(popupContent(point.properties));
  markersById.set(String(point.properties.id), marker);
  return marker;
}

function zoomToPoint(point) {
  const marker = markersById.get(String(point.properties.id));
  if (!marker) return;
  map.flyTo(marker.getLatLng(), 13, { duration: 0.45 });
  marker.openPopup();
  if (window.matchMedia("(max-width: 760px)").matches) {
    sidebar.classList.add("is-collapsed");
    sidebarToggle.setAttribute("aria-expanded", "false");
    sidebarToggle.textContent = "Mostrar painel";
    window.setTimeout(() => map.invalidateSize(), 200);
  }
}

function renderList(filteredPoints) {
  pointList.replaceChildren();
  for (const point of filteredPoints) {
    const properties = point.properties;
    const item = document.createElement("li");
    item.className = "point-item";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "point-button";
    button.innerHTML = `<span class="legend-dot ${escapeHtml(properties.categoria)}-dot" aria-hidden="true"></span><span><span class="point-name">${escapeHtml(properties.nome)}</span><span class="point-municipality">${escapeHtml(properties.municipio)} · ${escapeHtml(CATEGORY_LABELS[properties.categoria] || properties.categoria)}</span></span>`;
    button.addEventListener("click", () => zoomToPoint(point));
    item.append(button);
    pointList.append(item);
  }
}

function render() {
  const query = searchInput.value.trim().toLocaleLowerCase("pt-BR");
  const category = categorySelect.value;
  const municipality = municipalitySelect.value;
  const matches = points.filter(({ properties }) =>
    properties.nome.toLocaleLowerCase("pt-BR").includes(query)
    && (!category || properties.categoria === category)
    && (!municipality || properties.municipio === municipality)
  );

  markerLayer.clearLayers();
  for (const point of matches) markerLayer.addLayer(markersById.get(String(point.properties.id)));
  renderList(matches);
  resultCount.textContent = `${matches.length} ${matches.length === 1 ? "ponto" : "pontos"}`;
  resultMessage.hidden = matches.length > 0;
  resultMessage.textContent = matches.length === 0
    ? "Nenhum ponto encontrado. Tente outro termo ou limpe os filtros para explorar o mapa."
    : "";
}

function populateMunicipalities() {
  const municipalities = [...new Set(points.map(({ properties }) => properties.municipio))]
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
  for (const municipality of municipalities) {
    const option = document.createElement("option");
    option.value = municipality;
    option.textContent = municipality;
    municipalitySelect.append(option);
  }
}

function populateLegendIcons() {
  document.querySelectorAll(".legend-marker").forEach((element) => {
    const category = element.dataset.category;
    if (CATEGORY_ICONS[category]) {
      element.innerHTML = categoryIconSvg(category, CATEGORY_LABELS[category], true);
    }
  });
}

async function loadPoints() {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error(`Não foi possível carregar ${DATA_URL} (HTTP ${response.status}).`);
    }
    const geojson = await response.json();
    if (geojson.type !== "FeatureCollection" || !Array.isArray(geojson.features)) {
      throw new Error("O arquivo GeoJSON não contém uma FeatureCollection válida.");
    }
    points = geojson.features.filter((feature) =>
      feature?.geometry?.type === "Point"
      && Array.isArray(feature.geometry.coordinates)
      && feature.geometry.coordinates.length >= 2
      && Number.isFinite(feature.geometry.coordinates[0])
      && Number.isFinite(feature.geometry.coordinates[1])
      && feature.properties?.id !== undefined
      && feature.properties?.nome
      && CATEGORY_LABELS[feature.properties?.categoria]
    );
    if (points.length !== geojson.features.length) {
      console.warn("Algumas feições GeoJSON inválidas foram ignoradas.");
    }
    if (points.length === 0) {
      throw new Error("O GeoJSON não possui pontos válidos para exibir.");
    }

    for (const point of points) createPoint(point);
    populateMunicipalities();
    populateLegendIcons();
    render();
    map.fitBounds(markerLayer.getBounds().pad(0.08));
  } catch (error) {
    console.error("Falha ao carregar os pontos do mapa:", error);
    resultCount.textContent = "Dados indisponíveis";
    resultMessage.hidden = false;
    resultMessage.textContent = "Não foi possível carregar os pontos do mapa. Verifique sua conexão e abra o projeto por um servidor local ou GitHub Pages.";
  }
}

searchInput.addEventListener("input", render);
categorySelect.addEventListener("change", render);
municipalitySelect.addEventListener("change", render);
filtersForm.addEventListener("reset", () => window.setTimeout(render, 0));
document.getElementById("show-all").addEventListener("click", () => {
  searchInput.value = "";
  categorySelect.value = "";
  municipalitySelect.value = "";
  render();
  if (markerLayer.getLayers().length > 0) map.fitBounds(markerLayer.getBounds().pad(0.08));
});
sidebarToggle.addEventListener("click", () => {
  const isExpanded = sidebarToggle.getAttribute("aria-expanded") === "true";
  sidebar.classList.toggle("is-collapsed", isExpanded);
  sidebarToggle.setAttribute("aria-expanded", String(!isExpanded));
  sidebarToggle.textContent = isExpanded ? "Mostrar painel" : "Ocultar painel";
  window.setTimeout(() => map.invalidateSize(), 200);
});

loadPoints();
