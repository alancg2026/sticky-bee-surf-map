# Sticky Bee Surf Map — Surf, natureza e sustentabilidade em Santa Catarina

## Objetivo e tema

Webmap acadêmico de Programação Aplicada ao Geoprocessamento para explorar praias e picos de surf, áreas protegidas e iniciativas ambientais costeiras de Santa Catarina. A pesquisa, os filtros por categoria e município, a lista e os popups ajudam a conhecer os pontos de forma interativa.

## Tecnologias e categorias

- HTML5, CSS3 e JavaScript puro;
- Leaflet para o mapa interativo;
- GeoJSON para os pontos;
- OpenStreetMap como fonte cartográfica e mapa-base;
- categorias: surf e praias (amarelo), áreas protegidas (verde) e iniciativas ambientais (azul).

## Estrutura

```text
Sticky_Bee_Surf_Map/
├── index.html
├── style.css
├── script.js
├── README.md
├── .gitignore
└── dados/
    └── pontos.geojson
```

## Executar localmente

Abra um terminal na pasta raiz do projeto e inicie um servidor HTTP:

```powershell
py -m http.server 8000
```

Se `py` não estiver disponível e o Python 3.13 estiver instalado via uv:

```powershell
uv run --python 3.13 python -m http.server 8000
```

Abra <http://localhost:8000>. O servidor é necessário em alguns navegadores para permitir a leitura do GeoJSON com `fetch`. O mapa-base OSM e a biblioteca Leaflet carregada por CDN precisam de conexão com a internet; os ícones das categorias são SVGs locais.

## Publicar no GitHub Pages

1. Envie o conteúdo deste projeto para a raiz da branch `main` de um repositório GitHub.
2. No repositório, abra **Settings → Pages**.
3. Em **Build and deployment**, selecione **Deploy from a branch**.
4. Selecione a branch **main** e a pasta **/root**.
5. Clique em **Save** e aguarde a publicação indicada pelo GitHub.

O arquivo `index.html` está na raiz e os caminhos CSS, JavaScript e GeoJSON são relativos, compatíveis com publicação em GitHub Pages.

## Dados e limitações

Os pontos e as descrições são aproximados e educativos. **Valide coordenadas, nomes, descrições e limites oficiais antes de qualquer uso técnico.** Os pontos não representam polígonos ou limites oficiais de unidades de conservação; alguns locais extensos estão representados por uma coordenada de referência. Os links oficiais específicos não confirmados foram deixados vazios.

As informações de surf são gerais e variam com as condições do mar. Não substituem previsão meteorológica, avaliação de segurança nem orientação local.

O mapa-base utiliza dados cartográficos do [OpenStreetMap](https://www.openstreetmap.org/copyright), com atribuição exibida no mapa. A disponibilidade dos mapas e da CDN do Leaflet depende de serviços externos.

## Melhorias futuras

- Fotografias dos pontos;
- polígonos oficiais das unidades de conservação;
- integração com uma API marítima para ondas, swell, período, vento e temperatura, após avaliar cobertura, licenciamento e limites de uso.
