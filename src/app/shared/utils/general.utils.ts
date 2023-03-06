export class GeneralUtils {
  public static FilterArray([...arr]: readonly any[], filterText: string, key?: string): any[] {
    if (filterText) {
      return arr.filter((d) => {
        if (key) {
          return d[key]?.toString()?.toLowerCase()?.includes(filterText.toString()?.toLowerCase());
        }
        return d?.toString()?.toLowerCase().includes(filterText.toString().toLowerCase());
      });
    } else {
      return arr;
    }
  }
}
