# Responsiivisuus

Responsiivinen sivu mukautuu eri näyttöihin. Mobile first -ajattelu, suhteelliset mitat, `max-width`, `rem` ja media queryt auttavat.

```css
@media (max-width: 40rem) {
  .layout {
    grid-template-columns: 1fr;
  }
}
```