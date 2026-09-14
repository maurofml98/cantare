import type { ComponentType } from 'react';
import { WarmupScene } from './scenes/WarmupScene';
import { BreathScene } from './scenes/BreathScene';
import { PitchScene } from './scenes/PitchScene';
import { CoordinationScene } from './scenes/CoordinationScene';
import { FlexibilityScene } from './scenes/FlexibilityScene';
import { MixedVoiceScene } from './scenes/MixedVoiceScene';
import { CooldownScene } from './scenes/CooldownScene';
import { DefaultScene } from './scenes/DefaultScene';

export const SCENE_REGISTRY: Record<string, ComponentType> = {
  '1': WarmupScene,
  '2': BreathScene,
  '3': CoordinationScene,
  '4': FlexibilityScene,
  '5': PitchScene,
  '6': MixedVoiceScene,
  '7': CooldownScene,
};

export function getScene(exerciseId: string): ComponentType {
  return SCENE_REGISTRY[exerciseId] ?? DefaultScene;
}
