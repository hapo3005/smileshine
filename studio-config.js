(() => {
  'use strict';

  const deepFreeze=value=>{
    if(!value||typeof value!=='object'||Object.isFrozen(value))return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  };

  const services=[
    {id:'consult',category:'Beratung & Grundlagen',name:'Beratung / Vorbesprechung',publicName:'Beratung',publicGroup:'Beratung',publicDescription:'Persönliches Vorgespräch zu Wunsch, Ablauf und Möglichkeiten.',description:'Persönliches Vorgespräch zu Wunsch, Ablauf und Möglichkeiten.',duration:30,price:0,deposit:0,active:true,verification:'market',presentationSeed:true,internalNote:'Terminlänge bereits festgelegt. Preis ist noch offen und wird mit Birgit final bestätigt.'},
    {id:'brows-pmu',category:'Permanent Make-up · Augenbrauen',name:'Augenbrauen Permanent Make-up',publicName:'Augenbrauen',publicGroup:'Permanent Make-up',publicDescription:'Permanent Make-up für Form, Balance und Ausdruck.',description:'Dauerhafte Betonung und harmonische Formgebung der Augenbrauen.',duration:120,price:299,deposit:50,active:true,verification:'market',presentationSeed:true,internalNote:'Vorläufiger Markt-Arbeitswert 299 € · Anzahlung 50 €. Terminlänge bereits festgelegt. Preis mit Birgit final bestätigen.'},
    {id:'brows-refresh',category:'Permanent Make-up · Augenbrauen',name:'Augenbrauen-Auffrischung',description:'Auffrischung einer bestehenden Augenbrauenpigmentierung.',duration:90,price:169,deposit:30,active:true,verification:'market',presentationSeed:false,internalNote:'Vorläufiger Markt-Arbeitswert 169 € · Anzahlung 30 €. Terminlänge bereits festgelegt. Preis mit Birgit final bestätigen.'},
    {id:'pmu-followup-brows',category:'Permanent Make-up · Augenbrauen',name:'PMU-Nachbehandlung · Augenbrauen',description:'Kontrolle und gezielte Nachpigmentierung der Augenbrauen nach der Erstbehandlung.',duration:60,price:0,deposit:0,active:true,verification:'market',presentationSeed:false,internalNote:'Preis bewusst offen: mit Birgit klären, ob die Nachbehandlung enthalten oder separat berechnet wird. Terminlänge bereits festgelegt.'},
    {id:'lashline',category:'Permanent Make-up · Augen',name:'Wimpernkranzverdichtung',publicName:'Lid & Wimpernkranz',publicGroup:'Permanent Make-up',publicDescription:'Dezente Betonung der Augenpartie.',description:'Dezente Pigmentierung am Wimpernansatz für einen dichteren Ausdruck.',duration:90,price:249,deposit:50,active:true,verification:'market',presentationSeed:true,internalNote:'Vorläufiger Markt-Arbeitswert 249 € · Anzahlung 50 €. Terminlänge bereits festgelegt. Preis mit Birgit final bestätigen.'},
    {id:'lashline-refresh',category:'Permanent Make-up · Augen',name:'Wimpernkranz-Auffrischung',description:'Auffrischung einer bestehenden Pigmentierung am Wimpernkranz.',duration:90,price:149,deposit:30,active:true,verification:'market',presentationSeed:false,internalNote:'Vorläufiger Markt-Arbeitswert 149 € · Anzahlung 30 €. Terminlänge bereits festgelegt. Preis mit Birgit final bestätigen.'},
    {id:'pmu-followup-lash',category:'Permanent Make-up · Augen',name:'PMU-Nachbehandlung · Wimpernkranz',description:'Kontrolle und gezielte Nachpigmentierung des Wimpernkranzes.',duration:60,price:0,deposit:0,active:true,verification:'market',presentationSeed:false,internalNote:'Preis bewusst offen: mit Birgit klären, ob die Nachbehandlung enthalten oder separat berechnet wird. Terminlänge bereits festgelegt.'},
    {id:'lip-pmu',category:'Permanent Make-up · Lippen',name:'Lippenpigmentierung',publicName:'Lippen',publicGroup:'Permanent Make-up',publicDescription:'Pigmentierung für Kontur, Farbe und Frische.',description:'Natürlich wirkende Pigmentierung für Kontur, Farbe und Frische.',duration:150,price:349,deposit:75,active:true,verification:'market',presentationSeed:true,internalNote:'Vorläufiger Markt-Arbeitswert 349 € · Anzahlung 75 €. Terminlänge bereits festgelegt. Preis mit Birgit final bestätigen.'},
    {id:'lip-refresh',category:'Permanent Make-up · Lippen',name:'Lippen-Auffrischung',description:'Auffrischung einer bestehenden Lippenpigmentierung.',duration:120,price:199,deposit:40,active:true,verification:'market',presentationSeed:false,internalNote:'Vorläufiger Markt-Arbeitswert 199 € · Anzahlung 40 €. Terminlänge bereits festgelegt. Preis mit Birgit final bestätigen.'},
    {id:'pmu-followup-lips',category:'Permanent Make-up · Lippen',name:'PMU-Nachbehandlung · Lippen',description:'Kontrolle und gezielte Nachpigmentierung der Lippen nach der Erstbehandlung.',duration:90,price:0,deposit:0,active:true,verification:'market',presentationSeed:false,internalNote:'Preis bewusst offen: mit Birgit klären, ob die Nachbehandlung enthalten oder separat berechnet wird. Terminlänge bereits festgelegt.'}
  ];

  const config={
    schemaVersion:1,
    serviceCatalogVersion:6,
    mode:'presentation',
    studio:{
      name:'Smile & Shine',
      owner:{firstName:'Birgit',lastName:'Porn',displayName:'Birgit Porn'},
      category:'Permanent Make-up & Beauty',
      locationLabel:'Wittlich-Bombogen',
      brandLine:'PERMANENT MAKE-UP & BEAUTY · WITTLICH-BOMBOGEN',
      phone:{display:'06571 9561078',e164:'+4965719561078'},
      email:'',
      address:{
        street:'Raiffeisenstraße 4',
        postalCode:'54516',
        city:'Wittlich-Bombogen',
        mapCity:'Wittlich-Bombogen',
        display:'Raiffeisenstraße 4 · 54516 Wittlich-Bombogen',
        pickup:'Raiffeisenstraße 4, 54516 Wittlich-Bombogen'
      }
    },
    legal:{
      verified:false,
      businessName:'smile & shine GmbH',
      representative:'Birgit Porn',
      registerCourt:'Amtsgericht Wittlich',
      registerNumber:'HRB 21773',
      vatId:'DE213952194',
      website:{label:'www.smile-shine.de',url:'https://www.smile-shine.de/'}
    },
    content:{
      meta:{
        title:'Smile & Shine · Wittlich-Bombogen',
        description:'Smile & Shine in Wittlich-Bombogen – Permanent Make-up & Beauty. Präzise Behandlungen, natürliche Ergebnisse und persönliche Beratung in ruhiger Atmosphäre.'
      },
      hero:{
        eyebrow:'Birgit Porn · Permanent Make-up & Beauty',
        captionLabel:'Smile & Shine · Wittlich-Bombogen',
        caption:'Ruhig. Präzise. Auf dich abgestimmt.',
        location:'Wittlich-Bombogen',
        lead:'Form, Farbe und Ausdruck werden nicht nach einem Schema gewählt. Bei Smile & Shine beginnt jede Behandlung mit einem genauen Blick auf dich – für ein Ergebnis, das gepflegt, harmonisch und selbstverständlich wirkt.'
      },
      treatments:{
        headline:'Drei Bereiche. Ein Anspruch: Es muss zu dir passen.',
        intro:'Permanent Make-up soll nicht wie ein Effekt wirken. Entscheidend ist das Zusammenspiel aus Proportion, Farbe und gewünschter Wirkung – abgestimmt auf dein Gesicht und deinen Alltag.'
      },
      about:{
        eyebrow:'Birgit Porn · Über mich',
        headline:'Erfahrung erkennt man nicht an Lautstärke. Sondern am Ergebnis.',
        intro:'Schönheit bedeutet für mich nicht, einem Trend zu folgen. Sie beginnt damit, genau hinzusehen: Welche Form passt zu deinem Gesicht? Welche Wirkung wünschst du dir? Und was fühlt sich wirklich nach dir an?',
        body:'Langjährige Beauty-Erfahrung, ein geschultes Auge für Proportionen, Farbe und Balance sowie eine ehrliche Beratung bilden die Grundlage jeder Behandlung.',
        statement:'„Nicht mehr. Nicht auffälliger. Sondern stimmiger.“'
      },
      contact:{
        headline:'Alles geklärt, bevor du losfährst.',
        intro:'Termin, Vorbereitung und Anfahrt greifen bei Smile & Shine ineinander. So weißt du vor deinem Besuch, was dich erwartet und kannst dich ganz auf deinen Termin konzentrieren.'
      },
      shop:{
        headline:'Online auswählen. Im Studio abholen.',
        intro:'Ausgewählte Pflegeprodukte können online in den Warenkorb gelegt und anschließend bei Smile & Shine in Wittlich-Bombogen abgeholt werden.'
      },
      footer:{
        descriptor:'Permanent Make-up & Beauty · Wittlich-Bombogen'
      }
    },
    schedule:{
      slotInterval:15,
      buffer:10,
      workingHours:{
        1:{enabled:true,start:'09:00',end:'19:00'},
        2:{enabled:true,start:'09:00',end:'19:00'},
        3:{enabled:true,start:'09:00',end:'19:00'},
        4:{enabled:true,start:'09:00',end:'19:00'},
        5:{enabled:true,start:'09:00',end:'19:00'},
        6:{enabled:false,start:'09:00',end:'13:00'},
        0:{enabled:false,start:'09:00',end:'13:00'}
      }
    },
    services,
    media:{
      hero:{
        status:'temporary',
        requiredForLive:true,
        url:'https://images.pexels.com/photos/6899542/pexels-photo-6899542.jpeg?auto=compress&cs=tinysrgb&w=1800',
        alt:'Heller, moderner Beauty-Behandlungsraum in warmen neutralen Tönen',
        shotBrief:'Breiter moderner Behandlungsraum, warm-neutrale Architektur, ruhige helle Fläche links für Text, Behandlungsliege und Interior rechts.'
      },
      about:{
        status:'temporary',
        requiredForLive:true,
        url:'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=1400&q=90',
        alt:'Vorläufiges Beauty-Editorial für die Über-mich-Sektion',
        shotBrief:'Authentisches Portrait von Birgit im Studio, natürliches Licht, ruhiger Hintergrund, Hochformat.'
      },
      brows:{
        status:'temporary',requiredForLive:true,
        url:'https://images.pexels.com/photos/8990708/pexels-photo-8990708.jpeg?auto=compress&cs=tinysrgb&w=1400',
        shotBrief:'Detailaufnahme Augenbrauen / Behandlung, sauber, natürlich, keine übertriebene Retusche.'
      },
      eyes:{
        status:'temporary',requiredForLive:true,
        url:'https://images.pexels.com/photos/13965213/pexels-photo-13965213.jpeg?auto=compress&cs=tinysrgb&w=1400',
        shotBrief:'Detailaufnahme Augenpartie / Wimpernkranz mit natürlicher Wirkung.'
      },
      lips:{
        status:'temporary',requiredForLive:true,
        url:'https://images.pexels.com/photos/14358835/pexels-photo-14358835.jpeg?auto=compress&cs=tinysrgb&w=1400',
        shotBrief:'Detailaufnahme Lippen mit natürlicher Farbwirkung und weichem Licht.'
      }
    },
    onboarding:{
      requiredBeforeLive:[
        'Leistungsnamen mit Birgit bestätigen',
        'Preise und Anzahlungen bestätigen',
        'Arbeitszeiten bestätigen',
        'Kontakt- und Pflichtangaben bestätigen',
        'Eigene Studio- und Behandlungsfotos einsetzen',
        'Kommunikationsvorlagen sprachlich freigeben'
      ]
    },
    runtime:{
      dataProvider:'local-demo',
      backendTarget:'api',
      mediaProvider:'config',
      authProvider:'demo'
    }
  };

  window.SmileShineConfig=deepFreeze(config);
})();