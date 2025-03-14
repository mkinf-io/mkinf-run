export { }; // This makes the file a module

type Grouped<T> = {
  [key: string]: T[];
};

// Augment the Array interface
declare global {
  interface Array<T> {
    groupBy<K extends string | number | symbol | null>(
      keyGetter: (item: T) => K
    ): Grouped<T>;
  }
}

// Add the implementation of the groupBy method
if (!Array.prototype.groupBy) {
  Array.prototype.groupBy = function <T, K extends string | number | symbol | null>(
    this: T[],
    keyGetter: (item: T) => K
  ): Grouped<T> {
    return this.reduce((result, currentItem) => {
      const key = keyGetter(currentItem) as string;
      if (!result[key]) {
        result[key] = [];
      }
      result[key].push(currentItem);
      return result;
    }, {} as Grouped<T>);
  };
}
