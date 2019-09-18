#include <emscripten/emscripten.h>

const int FORWARD = 0;
const int STARBOARD = 1;
const int LARBOARD = 2;

int move = -1;

extern "C" {
  int main(int argc, char ** argv) {
    move = FORWARD;
  }

  int EMSCRIPTEN_KEEPALIVE run(int positionX, int positionY) {
    move = LARBOARD;
    printf("x: %d, y: %d", positionX, positionY);
    return 0;
  }

  int EMSCRIPTEN_KEEPALIVE examine() {
    return move;
  }
}
