export class BaristaA implements Barista {
  makeCoffe(menu: MenuItem): Coffe {
    return new Coffe(menu);
  }
}
