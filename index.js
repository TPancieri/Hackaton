let map;
let autocomplete;
let marker = null; // Variável para armazenar o marcador único
let position = { lat: -16.68486087813813, lng: -49.27944418992962 }; // Localização inicial
let address = "Carregando endereço..."; // Endereço inicial
let reportMarkers = []; // Lista para armazenar os marcadores de reportes salvos

// Inicializar o mapa e o autocomplete
async function initMap() {
  // Importar bibliotecas necessárias
  //@ts-ignore
  const { Map } = await google.maps.importLibrary("maps");
  const { Autocomplete } = await google.maps.importLibrary("places");

  // Inicializar o mapa
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 11,
    center: position,
    mapId: "e7bfc9bb232c67b4",
    mapTypeControl: false,
    streetViewControl: false,
  });

  // Inicializar o Autocomplete
  const input = document.getElementById("location-input");
  autocomplete = new Autocomplete(input, {
    fields: ["geometry", "formatted_address"],
    types: ["geocode"],
  });

  // Carregar reportes existentes
  await loadReports();

  // Adicionar listeners
  addMapClickListener();
  addAutocompleteListener(autocomplete);
  addReportButtonListener();
}

// Carregar os reportes existentes do backend e adicionar no mapa
async function loadReports() {
  try {
    const response = await fetch("http://localhost:3000/reports");
    if (!response.ok) {
      console.error("Erro ao carregar reportes:", response.statusText);
      return;
    }

    const reports = await response.json();

    // Remover marcadores antigos, se existirem
    reportMarkers.forEach((marker) => marker.setMap(null));
    reportMarkers = [];

    // Adicionar marcadores para cada reporte
    reports.forEach((report) => {
      const reportMarker = new google.maps.Marker({
        position: { lat: report.latitude, lng: report.longitude },
        map: map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10, // Aumentar o tamanho do ponto
          fillColor: "orange",
          fillOpacity: 0.6, // Tornar o ponto levemente opaco
          strokeWeight: 0, // Sem borda
        },
        title: `Reporte: ${report.description}`,
      });

      reportMarkers.push(reportMarker);
    });

    console.log("Reportes carregados e adicionados no mapa:", reports);
  } catch (error) {
    console.error("Erro ao buscar os reportes do servidor:", error);
  }
}


// Atualizar a posição global, endereço, centralizar o mapa e mover o marcador
async function updatePosition(newPosition) {
  position = newPosition; // Atualizar posição global

  // Atualizar ou criar o marcador
  if (marker) {
    marker.setPosition(position);
  } else {
    marker = new google.maps.Marker({
      position: position,
      map: map,
    });
  }

  // Atualizar o campo de localização atual e o endereço no formulário
  updateCurrentLocationInput();
  await updateAddressInput();

  console.log(`Posição atualizada: Latitude: ${position.lat}, Longitude: ${position.lng}`);
}

// Atualizar o campo de localização atual no formulário
function updateCurrentLocationInput() {
  const currentLocationInput = document.getElementById("currentLocation");
  if (currentLocationInput) {
    currentLocationInput.value = `Latitude: ${position.lat}, Longitude: ${position.lng}`;
  }
}

// Atualizar o campo do endereço no formulário
async function updateAddressInput() {
  const geocoder = new google.maps.Geocoder();
  const initialLocationInput = document.getElementById("initialLocation");
  const inputMap = document.getElementById("input-map"); // Referência ao campo input-map

  try {
    const response = await geocoder.geocode({ location: position });
    if (response.results && response.results[0]) {
      address = response.results[0].formatted_address.replace(/^[A-Z0-9\+]+\s/, ""); // Atualizar endereço

      // Atualizar o campo de endereço no formulário
      if (inputMap) {
        inputMap.value = address; // Preencher o campo input-map com o endereço
      }

      if (initialLocationInput) {
        initialLocationInput.value = address; // Atualizar o campo inicialLocation também
      }

      console.log(`Endereço atualizado: ${address}`);
    } else {
      console.warn("Nenhum endereço encontrado para a posição atual.");
      // Preencher campos com valor padrão
      if (inputMap) inputMap.value = "Endereço não encontrado";
      if (initialLocationInput) initialLocationInput.value = "Endereço não encontrado";
    }
  } catch (error) {
    console.error("Erro ao buscar o endereço:", error);
    // Preencher campos com mensagem de erro
    if (inputMap) inputMap.value = "Erro ao buscar endereço";
    if (initialLocationInput) initialLocationInput.value = "Erro ao buscar endereço";
  }
}


// Adicionar listener de clique no mapa
function addMapClickListener() {
  map.addListener("click", async (event) => {
    const newPosition = { lat: event.latLng.lat(), lng: event.latLng.lng() };
    await updatePosition(newPosition); // Atualizar posição ao clicar no mapa
  });
}

// Adicionar listener para seleção do Autocomplete
function addAutocompleteListener(autocomplete) {
  autocomplete.addListener("place_changed", async () => {
    const place = autocomplete.getPlace();
    if (place.geometry) {
      const newPosition = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };
      await updatePosition(newPosition); // Atualizar posição com o Autocomplete

      console.log("Endereço selecionado:", place.formatted_address);
    } else {
      console.error("Endereço inválido ou não encontrado.");
      alert("Endereço inválido ou não encontrado.");
    }
  });
}

// Adicionar listener ao botão de reporte
function addReportButtonListener() {
  const reportButton = document.getElementById("reportButton");
  const reportModal = new bootstrap.Modal(document.getElementById("reportModal"));
  const reportForm = document.getElementById("reportForm");

  if (reportButton) {
    // Abrir o modal ao clicar no botão
    reportButton.addEventListener("click", async () => {
      // Verificar se o marcador está posicionado
      if (!marker || !marker.getPosition()) {
        alert("Por favor, posicione um marcador no mapa antes de continuar.");
        return;
      }

      // Garantir que os inputs estejam atualizados antes de abrir o modal
      await updateAddressInput();
      updateCurrentLocationInput();

      reportModal.show();
    });

    // Enviar os dados do formulário ao backend
    reportForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const description = document.getElementById("description").value;

      if (!description) {
        alert("Por favor, insira uma descrição.");
        return;
      }

      try {
        const response = await fetch("http://localhost:3000/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: position.lat,
            longitude: position.lng,
            address: address,
            description: description,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          alert("Reporte criado com sucesso! ID: " + data.id);
          reportModal.hide();
          reportForm.reset();

          // Recarregar os marcadores no mapa
          await loadReports();
        } else {
          alert("Erro ao criar o reporte. Tente novamente.");
        }
      } catch (error) {
        console.error("Erro ao enviar o reporte:", error);
        alert("Erro ao criar o reporte. Verifique sua conexão.");
      }
    });
  } else {
    console.error("Botão de reporte não encontrado.");
  }
}

// Função para carregar os últimos reports e atualizá-los na interface
async function loadLatestReports() {
  try {
    const response = await fetch("http://localhost:3000/latest-reports");
    if (!response.ok) {
      console.error("Erro ao carregar os últimos reportes:", response.statusText);
      return;
    }

    const reports = await response.json();

    // Selecionar o container de alertas
    const alertsContainer = document.querySelector(".d-flex.flex-column.gap-3");

    // Limpar alertas antigos
    alertsContainer.innerHTML = "";

    // Criar alertas para os registros recebidos
    reports.forEach((report) => {
      const alertDiv = document.createElement("div");
      alertDiv.className = `alert alert-${
        report.status === "pendente" ? "warning" : "primary"
      } text-center`;

      alertDiv.innerHTML = `
        <h5>${report.address || "Local não especificado"}</h5>
        <p>${report.description}</p>
        <small>Registrado em: ${new Date(report.created_at).toLocaleString()}</small>
      `;

      alertsContainer.appendChild(alertDiv);
    });
  } catch (error) {
    console.error("Erro ao buscar os últimos reportes:", error);
  }
}

// Chamar a função ao inicializar o mapa
initMap().then(() => loadLatestReports());
