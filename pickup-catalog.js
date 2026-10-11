(() => {
'use strict';
const KEY='smileshine_products_demo_v1';
  const defaults=[
    {id:'clearing-foam',quantity:50,quantityUnit:'ml',name:'aesthetic world Clearing Foam',size:'50 ml',price:14.90,category:'Reinigung',description:'Sanfter Reinigungsschaum für Make-up und Alltagsschmutz – gründlich, ohne die Haut unnötig auszutrocknen.',image:'https://shop.cnc-cosmetic.de/media/e1/d4/f9/1752582541/ac757d7728904503c4160f249f47c2dc.jpg?ts=1752582541'},
    {id:'facial-tonic',quantity:200,quantityUnit:'ml',name:'aesthetic world Facial Tonic',size:'200 ml',price:25.90,category:'Tonic',description:'Alkoholfreies Gesichtstonic mit Aloe Vera, Hyaluronsäure und Panthenol für ein frisches, geklärtes Hautgefühl.',image:'https://shop.cnc-cosmetic.de/media/29/6b/4e/1752582641/b258d9424c8efcac1cd344d8396082b0.jpg?ts=1752582641'},
    {id:'hyaluron-serum',quantity:30,quantityUnit:'ml',name:'aesthetic world Hyaluron Forte Serum',size:'30 ml',price:68.00,category:'Serum',description:'Hochkonzentriertes Hyaluronserum für intensive Feuchtigkeit und einen sichtbar frischeren, aufgepolsterten Look.',image:'https://shop.cnc-cosmetic.de/media/d0/b3/45/1752582944/7418d586e18a0c0eaf3b308831c46eec.jpg?ts=1752582944'},
    {id:'hyaluron-creme',quantity:50,quantityUnit:'ml',name:'classic Hyaluron Creme',size:'50 ml',price:33.90,category:'Feuchtigkeit',description:'Leichte Hyaluron-Pflege für jeden Tag – spendet Feuchtigkeit und unterstützt ein entspanntes, strahlendes Hautbild.',image:'https://shop.cnc-cosmetic.de/media/48/a3/88/1753793107/0384840ddb52334cf655a3e0dce20006.jpg?ts=1753793107'},
    {id:'eye-cream',quantity:15,quantityUnit:'ml',name:'PREMIUM EYE CREAM',size:'15 ml',price:89.00,category:'Augenpflege',description:'Intensive Premium-Pflege für die empfindliche Augenpartie mit Feuchtigkeit und glättendem Pflegefokus.',image:'https://shop.cnc-cosmetic.de/media/b5/21/f5/1745929985/bc43f3a8a91b764dbfd27b075cdaa6b9.jpg?ts=1745929985'},
    {id:'uv-protect',quantity:30,quantityUnit:'ml',name:'aesthetic world Anti-Aging UV Protect SPF 50',size:'30 ml',price:44.00,category:'UV-Schutz',description:'Leichter Gesichtsschutz mit SPF 50, Hyaluron und Ectoin – ideal als täglicher Abschluss der Pflegeroutine.',image:'https://shop.cnc-cosmetic.de/media/c1/7e/7e/1752582952/991a126fc5c9c0e9b1875be4a288f95d.jpg?ts=1752582952'},
    {id:'lipcare',quantity:4.6,quantityUnit:'g',name:'SUN Lipcare SPF 30',size:'4,6 g',price:7.50,category:'Lippenpflege',description:'Pflegender Lippenstift mit SPF 30 für trockene, spröde Lippen – besonders passend rund um Lippenpflege und PMU.',image:'https://shop.cnc-cosmetic.de/media/73/c9/1f/1742990972/904e42c39b1a771e972b58497c7db8a5.jpg?ts=1742990972'},
    {id:'edition-4',quantity:50,quantityUnit:'ml',name:'edition 4.0',size:'50 ml',price:109.00,category:'Premium Anti-Aging',description:'Next-Generation Gesichtspflege mit Lift-&-Repair-Fokus, Hyaluronsäure und regenerationsorientierter Pflegeformel.',image:'https://shop.cnc-cosmetic.de/media/37/79/e8/1768321649/6e3583a86a3b85e6a696bbc48f10bff6.jpg?ts=1768321649'}
  ];
const clone=o=>JSON.parse(JSON.stringify(o));
const valid=x=>x&&typeof x.id==='string'&&typeof x.name==='string'&&Number.isFinite(Number(x.price))&&Number(x.price)>=0;
function list(){
  try{const raw=localStorage.getItem(KEY);if(!raw)return clone(defaults);
    const parsed=JSON.parse(raw);
    if(!Array.isArray(parsed))return clone(defaults);
    return parsed.filter(valid).map(p=>({...p,price:Number(p.price),quantity:Number(p.quantity)||1,quantityUnit:p.quantityUnit||'ml',active:p.active!==false,stock:p.stock===undefined?null:Math.max(0,Number(p.stock)||0)}));
  }catch{return clone(defaults)}
}
function save(products){if(!Array.isArray(products)||!products.every(valid))throw Error('Ungültige Produktdaten');localStorage.setItem(KEY,JSON.stringify(products));window.dispatchEvent(new Event('smileshine:products-changed'))}
window.SmileShineCatalog={KEY,list,save,defaults:clone(defaults)};
})();