import { Game } from './Game';
import { SceneManager } from './managers/SceneManager';
import { TitleScene } from './scenes/TitleScene';
import { GameScene } from './scenes/GameScene';
import { PauseScene } from './scenes/PauseScene';
import { DeathScene } from './scenes/DeathScene';
import { GameOverScene } from './scenes/GameOverScene';
import { VictoryScene } from './scenes/VictoryScene';

async function main() {
  const game = new Game('canvas-wrapper');
  const sceneManager = new SceneManager(game.ctx);

  sceneManager.addScene('title', new TitleScene(sceneManager));
  sceneManager.addScene('game', new GameScene(sceneManager));
  sceneManager.addScene('pause', new PauseScene(sceneManager));
  sceneManager.addScene('death', new DeathScene(sceneManager));
  sceneManager.addScene('gameover', new GameOverScene(sceneManager));
  sceneManager.addScene('victory', new VictoryScene(sceneManager));

  game.setSceneManager(sceneManager);

  await sceneManager.transition('title');

  game.start();

  console.log('Wyrm Chase started!');
}

main().catch((error) => {
  console.error('Failed to start game:', error);
  document.body.innerHTML = `
    <div style="color: red; padding: 2rem; text-align: center;">
      <h1>Failed to start game</h1>
      <pre>${error.message}</pre>
    </div>
  `;
});
