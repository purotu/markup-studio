# CSS Grid

Grid sopii kaksiulotteisiin asetteluihin. Määritä sarakkeet `grid-template-columns`-ominaisuudella ja käytä `fr`-yksikköä jakamaan käytettävissä oleva tila.

```css
.gallery {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}
```