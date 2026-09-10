# Lomakkeet

Lomakkeissa `label` yhdistetään kenttään `for`- ja `id`-attribuuteilla. Valitse inputille sopiva tyyppi ja käytä `required`-attribuuttia pakollisissa tiedoissa.

```html
<form>
  <label for="email">Sähköposti</label>
  <input id="email" type="email" required>
</form>
```