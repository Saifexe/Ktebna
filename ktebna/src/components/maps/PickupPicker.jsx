import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, TriangleAlert, X } from "lucide-react";
import {
  AdvancedMarker,
  APILoadingStatus,
  APIProvider,
  Map,
  Pin,
  useApiLoadingStatus,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { cityCenter, hasPin, MAP_ID, MAPS_KEY, TUNISIA_CENTER } from "../../lib/maps";

// Places search box (Places API "New" web component), biased to the chosen city.
const PlaceSearch = ({ city, onSelect }) => {
  const { t } = useTranslation();
  const places = useMapsLibrary("places");
  const containerRef = useRef(null);
  const elementRef = useRef(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!places || !containerRef.current || elementRef.current) return;
    const el = new places.PlaceAutocompleteElement({ includedRegionCodes: ["tn"] });
    el.placeholder = t("map.search");
    el.style.width = "100%";
    el.style.colorScheme = "light dark";
    el.addEventListener("gmp-select", async ({ placePrediction }) => {
      const place = placePrediction.toPlace();
      await place.fetchFields({ fields: ["displayName", "location"] });
      if (!place.location) return;
      onSelectRef.current({
        lat: place.location.lat(),
        lng: place.location.lng(),
        spot: place.displayName || "",
      });
    });
    containerRef.current.appendChild(el);
    elementRef.current = el;
  }, [places, t]);

  useEffect(() => {
    const center = cityCenter(city);
    if (elementRef.current && center) {
      elementRef.current.locationBias = { center, radius: 25000 };
    }
  }, [city, places]);

  return <div ref={containerRef} className="min-h-11" />;
};

const PickerMap = ({ city, value, onChange }) => {
  const map = useMap();
  const pinned = hasPin(value.lat, value.lng);

  // Follow the city select until the seller drops a pin of their own.
  useEffect(() => {
    const center = cityCenter(city);
    if (!map || !center || pinned) return;
    map.panTo(center);
    map.setZoom(12);
  }, [map, city, pinned]);

  useEffect(() => {
    if (map && pinned) map.panTo({ lat: value.lat, lng: value.lng });
  }, [map, pinned, value.lat, value.lng]);

  return (
    <Map
      mapId={MAP_ID}
      defaultCenter={pinned ? { lat: value.lat, lng: value.lng } : cityCenter(city) || TUNISIA_CENTER}
      defaultZoom={pinned ? 16 : cityCenter(city) ? 12 : 6}
      gestureHandling="cooperative"
      disableDefaultUI
      zoomControl
      colorScheme="FOLLOW_SYSTEM"
      clickableIcons={false}
      onClick={(e) => e.detail.latLng && onChange({ ...e.detail.latLng, spot: "" })}
      className="h-72 w-full"
    >
      {pinned && (
        <AdvancedMarker
          position={{ lat: value.lat, lng: value.lng }}
          draggable
          onDragEnd={(e) => e.latLng && onChange({ lat: e.latLng.lat(), lng: e.latLng.lng(), spot: value.spot })}
        >
          <Pin background="var(--primary)" borderColor="var(--primary-foreground)" glyphColor="var(--primary-foreground)" />
        </AdvancedMarker>
      )}
    </Map>
  );
};

const PickerBody = ({ city, value, onChange }) => {
  const { t } = useTranslation();
  const status = useApiLoadingStatus();
  const pinned = hasPin(value.lat, value.lng);

  if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
    return (
      <p className="flex gap-2 rounded-md bg-muted p-3 text-sm text-muted-foreground">
        <TriangleAlert className="size-4 shrink-0" /> {t("map.loadError")}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <PlaceSearch city={city} onSelect={onChange} />
      <div className="overflow-hidden rounded-lg border">
        <PickerMap city={city} value={value} onChange={onChange} />
      </div>
      {pinned ? (
        <div className="flex items-center gap-3 rounded-md bg-trust-soft p-3 text-sm text-trust">
          <MapPin className="size-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <b className="block truncate">{value.spot || t("map.pinned")}</b>
            <span className="text-xs opacity-80">{t("map.dragHint")}</span>
          </div>
          <button
            type="button"
            onClick={() => onChange({ lat: null, lng: null, spot: "" })}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold hover:bg-background/60"
          >
            <X className="size-3" /> {t("map.clear")}
          </button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{t("map.hint")}</p>
      )}
    </div>
  );
};

// Optional meeting-spot picker for the Sell flow: search a place or tap the map.
// value = { lat, lng, spot }; onChange receives the same shape.
const PickupPicker = ({ city, value, onChange }) => {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <p className="mb-2 text-sm font-bold">
        {t("map.title")} <span className="font-normal text-muted-foreground">({t("map.optional")})</span>
      </p>
      {MAPS_KEY ? (
        <APIProvider apiKey={MAPS_KEY} language={i18n.language?.split("-")[0]} region="TN">
          <PickerBody city={city} value={value} onChange={onChange} />
        </APIProvider>
      ) : (
        import.meta.env.DEV && (
          <p className="flex gap-2 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
            <TriangleAlert className="size-4 shrink-0" /> {t("map.noKey")}
          </p>
        )
      )}
    </div>
  );
};

export default PickupPicker;
