# Ensimmäinen HTML-sivu

HTML kuvaa verkkosivun rakenteen ja sisällön. Selain lukee elementit ylhäältä alas ja näyttää niiden perusteella sivun.

## Perusrakenne

Dokumentti alkaa yleensä `html`-elementistä. `head` sisältää sivun tekniset tiedot ja `body` käyttäjälle näkyvän sisällön.

```html
<html lang="fi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ensimmäinen HTML-sivu</title>
    </head>
    <body>
        <h1>Oma ensimmäinen otsikko</h1>
        <p>Tämä on ensimmäinen kappale.</p>
    </body>
</html>
```

Elementti on HTML:n perusyksikkö. Se koostuu aloitustagista, sisällöstä ja lopetustagista.

```html
<h1>Oma ensimmäinen otsikko</h1>
<p>Tämä on ensimmäinen kappale.</p>
```

Hyvä otsikkohierarkia alkaa yhdestä `h1`-otsikosta ja jatkuu tarvittaessa `h2`- ja `h3`-otsikoilla.