let map;
let autocomplete;

async function initMap() {
  // Localização inicial do mapa
  const position = { lat: -15.062471829919923, lng: -49.71394716117103 };

  // Importar bibliotecas necessárias
  //@ts-ignore
  const { Map } = await google.maps.importLibrary("maps");
  const { PlacesService, Autocomplete } = await google.maps.importLibrary("places");

  // Inicializar o mapa
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 6,
    center: position,
    mapId: "e7bfc9bb232c67b4",
    mapTypeControl: false,
    streetViewControl: false,
  });

  // Configurar o Autocomplete no campo de entrada
  const input = document.getElementById("location-input");
  autocomplete = new Autocomplete(input, {
    fields: ["geometry", "formatted_address"],
    types: ["geocode"],
  });

  // Evento para manipular seleção com o botão Enter
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault(); // Evita o comportamento padrão (submit)
      const place = autocomplete.getPlace();

      // Centralizar o mapa na localização selecionada
      map.setCenter(place.geometry.location);
      map.setZoom(15);

      // Adicionar marcador na localização
      new google.maps.Marker({
        position: place.geometry.location,
        map: map,
      });

      console.log("Endereço selecionado:", place.formatted_address);
    }
  });

  // Listener de seleção do Autocomplete
  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();
    if (!place.geometry) {
      alert("Endereço não encontrado!");
      return;
    }

    // Centralizar o mapa na localização selecionada
    map.setCenter(place.geometry.location);
    map.setZoom(15);

    // Adicionar marcador na localização
    new google.maps.Marker({
      position: place.geometry.location,
      map: map,
    });

    console.log("Endereço selecionado:", place.formatted_address);
  });
}

initMap();
