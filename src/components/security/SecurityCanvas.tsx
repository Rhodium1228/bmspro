// using react-konva v18.x compatible with React 18
import { forwardRef, useState, useRef, useEffect } from "react";
import { Stage, Layer, Image as KonvaImage, Circle, Rect, Line } from "react-konva";
import useImage from "use-image";
import { Video, Fan, Rss } from "lucide-react";
import { CanvasObject, Tool } from "@/pages/SecurityDesign";

interface SecurityCanvasProps {
  activeTool: Tool;
  canvasObjects: CanvasObject[];
  setCanvasObjects: (objects: CanvasObject[] | ((prev: CanvasObject[]) => CanvasObject[])) => void;
  selectedObject: CanvasObject | null;
  setSelectedObject: (object: CanvasObject | null) => void;
  floorPlanUrl: string | null;
}

const FloorPlanImage = ({ url }: { url: string }) => {
  const [image] = useImage(url, "anonymous");
  return <KonvaImage image={image} />;
};

const DeviceIcon = ({ 
  object, 
  isSelected, 
  onClick 
}: { 
  object: CanvasObject; 
  isSelected: boolean; 
  onClick: () => void;
}) => {
  const color = object.properties?.color || "#3b82f6";
  const size = 40;

  return (
    <>
      <Circle
        x={object.x}
        y={object.y}
        radius={size / 2}
        fill={color}
        opacity={0.8}
        stroke={isSelected ? "#fff" : "#000"}
        strokeWidth={isSelected ? 3 : 1}
        onClick={onClick}
        onTap={onClick}
        draggable
        onDragEnd={(e) => {
          object.x = e.target.x();
          object.y = e.target.y();
        }}
      />
      {/* Device type indicator - simplified for canvas */}
      <Circle
        x={object.x}
        y={object.y}
        radius={size / 4}
        fill="#fff"
        onClick={onClick}
        onTap={onClick}
      />
    </>
  );
};

export const SecurityCanvas = forwardRef<any, SecurityCanvasProps>(
  ({ activeTool, canvasObjects, setCanvasObjects, selectedObject, setSelectedObject, floorPlanUrl }, ref) => {
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentDrawing, setCurrentDrawing] = useState<CanvasObject | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });

    useEffect(() => {
      const updateDimensions = () => {
        if (containerRef.current) {
          setDimensions({
            width: containerRef.current.offsetWidth,
            height: containerRef.current.offsetHeight,
          });
        }
      };

      updateDimensions();
      window.addEventListener("resize", updateDimensions);
      return () => window.removeEventListener("resize", updateDimensions);
    }, []);

    const handleStageClick = (e: any) => {
      if (e.target === e.target.getStage()) {
        setSelectedObject(null);
      }

      const stage = e.target.getStage();
      const pointerPosition = stage.getPointerPosition();

      if (activeTool === "eraser") {
        const clickedObject = canvasObjects.find(obj => {
          const dx = obj.x - pointerPosition.x;
          const dy = obj.y - pointerPosition.y;
          return Math.sqrt(dx * dx + dy * dy) < 30;
        });
        if (clickedObject) {
          setCanvasObjects(prev => prev.filter(obj => obj.id !== clickedObject.id));
        }
        return;
      }

      if (activeTool === "camera" || activeTool === "fan" || activeTool === "pir") {
        const newObject: CanvasObject = {
          id: `${activeTool}-${Date.now()}`,
          type: activeTool,
          x: pointerPosition.x,
          y: pointerPosition.y,
          rotation: 0,
          scale: 1,
          properties: {
            color: activeTool === "camera" ? "#3b82f6" : activeTool === "fan" ? "#10b981" : "#f59e0b"
          },
        };
        setCanvasObjects(prev => [...prev, newObject]);
      }
    };

    const handleMouseDown = (e: any) => {
      if (activeTool === "select" || activeTool === "eraser" || 
          activeTool === "camera" || activeTool === "fan" || activeTool === "pir") {
        return;
      }

      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();
      setIsDrawing(true);

      const baseObject = {
        id: `${activeTool}-${Date.now()}`,
        type: activeTool as any,
        x: pos.x,
        y: pos.y,
        color: "#000",
      };

      if (activeTool === "line" || activeTool === "freehand") {
        setCurrentDrawing({ ...baseObject, points: [0, 0] });
      } else if (activeTool === "rectangle") {
        setCurrentDrawing({ ...baseObject, width: 0, height: 0 });
      } else if (activeTool === "circle") {
        setCurrentDrawing({ ...baseObject, radius: 0 });
      }
    };

    const handleMouseMove = (e: any) => {
      if (!isDrawing || !currentDrawing) return;

      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();

      if (activeTool === "freehand" && currentDrawing.points) {
        const newPoints = [...currentDrawing.points, pos.x - currentDrawing.x, pos.y - currentDrawing.y];
        setCurrentDrawing({ ...currentDrawing, points: newPoints });
      } else if (activeTool === "line" && currentDrawing.points) {
        setCurrentDrawing({ ...currentDrawing, points: [0, 0, pos.x - currentDrawing.x, pos.y - currentDrawing.y] });
      } else if (activeTool === "rectangle") {
        setCurrentDrawing({ 
          ...currentDrawing, 
          width: pos.x - currentDrawing.x, 
          height: pos.y - currentDrawing.y 
        });
      } else if (activeTool === "circle") {
        const radius = Math.sqrt(
          Math.pow(pos.x - currentDrawing.x, 2) + Math.pow(pos.y - currentDrawing.y, 2)
        );
        setCurrentDrawing({ ...currentDrawing, radius });
      }
    };

    const handleMouseUp = () => {
      if (isDrawing && currentDrawing) {
        setCanvasObjects(prev => [...prev, currentDrawing]);
        setCurrentDrawing(null);
      }
      setIsDrawing(false);
    };

    return (
      <div ref={containerRef} className="w-full h-full">
        <Stage
          ref={ref}
          width={dimensions.width}
          height={dimensions.height}
          onClick={handleStageClick}
          onTap={handleStageClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
        >
          <Layer>
            {floorPlanUrl && <FloorPlanImage url={floorPlanUrl} />}
            
            {canvasObjects.map(obj => {
              if (obj.type === "camera" || obj.type === "fan" || obj.type === "pir") {
                return (
                  <DeviceIcon
                    key={obj.id}
                    object={obj}
                    isSelected={selectedObject?.id === obj.id}
                    onClick={() => setSelectedObject(obj)}
                  />
                );
              }

              if (obj.type === "line" || obj.type === "freehand") {
                return (
                  <Line
                    key={obj.id}
                    x={obj.x}
                    y={obj.y}
                    points={obj.points}
                    stroke={obj.color}
                    strokeWidth={2}
                    lineCap="round"
                    lineJoin="round"
                    onClick={() => setSelectedObject(obj)}
                    onTap={() => setSelectedObject(obj)}
                  />
                );
              }

              if (obj.type === "rectangle") {
                return (
                  <Rect
                    key={obj.id}
                    x={obj.x}
                    y={obj.y}
                    width={obj.width}
                    height={obj.height}
                    stroke={obj.color}
                    strokeWidth={2}
                    onClick={() => setSelectedObject(obj)}
                    onTap={() => setSelectedObject(obj)}
                  />
                );
              }

              if (obj.type === "circle") {
                return (
                  <Circle
                    key={obj.id}
                    x={obj.x}
                    y={obj.y}
                    radius={obj.radius}
                    stroke={obj.color}
                    strokeWidth={2}
                    onClick={() => setSelectedObject(obj)}
                    onTap={() => setSelectedObject(obj)}
                  />
                );
              }

              return null;
            })}

            {currentDrawing && (
              <>
                {(currentDrawing.type === "line" || currentDrawing.type === "freehand") && (
                  <Line
                    x={currentDrawing.x}
                    y={currentDrawing.y}
                    points={currentDrawing.points}
                    stroke={currentDrawing.color}
                    strokeWidth={2}
                    lineCap="round"
                    lineJoin="round"
                  />
                )}
                {currentDrawing.type === "rectangle" && (
                  <Rect
                    x={currentDrawing.x}
                    y={currentDrawing.y}
                    width={currentDrawing.width}
                    height={currentDrawing.height}
                    stroke={currentDrawing.color}
                    strokeWidth={2}
                  />
                )}
                {currentDrawing.type === "circle" && (
                  <Circle
                    x={currentDrawing.x}
                    y={currentDrawing.y}
                    radius={currentDrawing.radius}
                    stroke={currentDrawing.color}
                    strokeWidth={2}
                  />
                )}
              </>
            )}
          </Layer>
        </Stage>
      </div>
    );
  }
);

SecurityCanvas.displayName = "SecurityCanvas";
