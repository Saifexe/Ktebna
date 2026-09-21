import { AdvancedMarker, APIProvider, Map, Pin } from "@vis.gl/react-google-maps";
import { useTranslation } from "react-i18next";
import { cityCenter, hasPin, MAP_ID, MAPS_KEY } from "../../lib/maps";

// Read-only map for the book page: the seller's pin, or just their city.
const PickupMap = ({ lat, lng, city, className = "h-44" }) => {
  const { i18n } = useTranslation();
  const pinned = hasPin(lat, lng);
  const center = pinned ? { lat, lng } : cityCenter(city);

  if (!MAPS_KEY || !center) return null;

  return (
    <APIProvider apiKey={MAPS_KEY} language={i18n.language?.split("-")[0]} region="TN">
      <div className={`overflow-hidden rounded-md border ${className}`}>
        <Map
          mapId={MAP_ID}
          defaultCenter={center}
          defaultZoom={pinned ? 15 : 12}
          gestureHandling="cooperative"
          disableDefaultUI
          zoomControl
          colorScheme="FOLLOW_SYSTEM"
          clickableIcons={false}
          className="size-full"
        >
          {pinned && (
            <AdvancedMarker position={center}>
              <Pin
                background="var(--primary)"
                borderColor="var(--primary-foreground)"
                glyphColor="var(--primary-foreground)"
              />
            </AdvancedMarker>
          )}
        </Map>
      </div>
    </APIProvider>
  );
};

export default PickupMap;
