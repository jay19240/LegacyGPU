export enum EngineEntityShape {
  CUBE = 'CUBE',
  CYLINDER = 'CYLINDER',
  CIRCLE = 'CIRCLE',
  PLANE = 'PLANE',
  SPHERE = 'SPHERE',
  UNKNOWN = 'UNKNOWN'
};

export interface EngineEntity {
  name: string;
  type: string;
  shape: EngineEntityShape;
  position: vec3;
  rotation: vec3;
  scale: vec3;
  width: number;
  height: number;
  depth: number;
  radius: number;
  customParams: any;
};

/**
 * Load asynchronously data and create entity from a json file (ent).
 * 
 * @param {string} path - The file path.
 */
export const createEntityFromFile = async (path: string): Promise<EngineEntity> => {
  const response = await fetch(path);
  const json = await response.json();

  if (!json.hasOwnProperty('Ident') || json['Ident'] != 'ENT') {
    throw new Error('EngineEntity::createFromFile(): File not valid !');
  }

  const customParams = new Array<{ name: string, value: number }>();
  for (const obj of json['CustomParams']) {
    customParams[obj['Name']] = obj['Value']
  }

  return {
    name: json['Name'],
    type: json['Type'],
    shape: json['Shape'],
    position: [json['PositionX'], json['PositionY'], json['PositionZ']],
    rotation: [json['RotationX'], json['RotationY'], json['RotationZ']],
    scale: [json['ScaleX'], json['ScaleY'], json['ScaleZ']],
    width: json['Width'],
    height: json['Height'],
    depth: json['Depth'],
    radius: json['Radius'],
    customParams: customParams
  }
}